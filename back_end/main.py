# main.py (com editar/deletar + seed)
from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from tempfile import NamedTemporaryFile
from typing import Optional, Dict
from collections import defaultdict
from datetime import datetime, timezone, timedelta
import sqlite3
import shutil
import os
import base64

# ========= App & Paths =========
app = FastAPI(title="IFC x Foto — Andamento de Obra (Metrô/Obras Civis)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_BASE_DIR = os.path.dirname(__file__)
_DB_DIR = os.path.join(_BASE_DIR, "db")
os.makedirs(_DB_DIR, exist_ok=True)

# Static: serve tudo que estiver dentro de /db
app.mount("/files", StaticFiles(directory=_DB_DIR), name="files")

DB_PATH = os.path.join(_DB_DIR, "database.db")

# ========= YOLO / IFC deps =========
from ultralytics import YOLOWorld
import ifcopenshell

YOLO_WEIGHTS = os.getenv("YOLOWORLD_WEIGHTS", "yolov8x-worldv2.pt")

# =========== Categorias & Aliases (PT/EN) ===========
CATEGORY_ALIASES = {
    # Civil / estrutural
    "reinforced concrete column": [
        "reinforced concrete column","concrete pillar","vertical concrete element",
        "pilar de concreto","coluna de concreto","pilar estrutural"
    ],
    "reinforced concrete beam": [
        "reinforced concrete beam","concrete beam","horizontal concrete element",
        "viga de concreto","viga estrutural"
    ],
    "concrete slab": [
        "concrete slab","floor slab concrete","reinforced concrete floor plate","horizontal concrete plate",
        "laje de concreto","laje"
    ],
    "masonry or concrete wall": [
        "masonry or concrete wall","concrete wall","unfinished masonry wall","construction wall structure",
        "parede de concreto","alvenaria"
    ],
    "concrete footing or foundation": [
        "concrete footing or foundation","concrete foundation block","footing block concrete",
        "sapata de concreto","bloco de fundação"
    ],
    "concrete pile": ["concrete pile","foundation pile","estaca de concreto"],
    "rebar": ["rebar","reinforcing steel bars","steel rebar bundle","vergalhão","armadura de aço"],
    "rebar mesh": ["rebar mesh","reinforcement mesh","welded wire mesh","tela soldada"],
    "steel plate": ["steel plate","metal plate structural","chapa de aço"],
    "roof structure": ["roof structure","roof slab","estrutura de cobertura"],
    "stair": ["stair","stair flight","escada","lanço de escada"],
    "ramp": ["ramp","ramp flight","rampa"],
    "railing": ["railing","guardrail","corrimão","guarda-corpo"],
    "curtain wall frame": ["curtain wall frame","façade frame","estrutura de fachada"],
    "formwork system": ["formwork system","concrete formwork panels","shuttering","fôrma","formas de concreto"],
    "scaffold structure": ["scaffold structure","scaffolding","andaime"],
    "temporary construction element": ["temporary construction element","temporary support structure","estrutura temporária"],

    # Ferrovia / túnel
    "rail track": ["rail track","railway track","track superstructure","via férrea","trilho montado"],
    "steel rail bar": ["steel rail bar","rail bar","rail section","trilho","barra de trilho"],
    "track sleeper / tie": ["railway sleeper","track sleeper","rail tie","dormente","travessa"],
    "rail fastening / clip": ["rail fastening","rail clip","pandrol clip","fixação de trilho","grampo de trilho"],
    "turnout / switch": ["rail turnout","railway switch","track switch","AMV","aparelho de mudança de via"],
    "ballast": ["track ballast","ballast bed","brita da via","lastro"],
    "third rail / power rail": ["third rail","power rail","trilho de alimentação","barra condutora"],
    "tunnel concrete lining segment": [
        "tunnel concrete lining","tunnel lining segment","concrete tunnel ring",
        "segmento de túnel","anel de túnel","revestimento de túnel"
    ],
    "cable tray": ["cable tray","cable carrier","bandeja de cabos"],
    "overhead cable / catenary support": [
        "overhead cable support","catenary support bracket","electrical conduit run",
        "suporte de cabos","suporte de catenária","eletroduto aparente"
    ],

    # Pistas genéricas (p/ fallback ε)
    "generic construction cues": [
        "construction site","concrete structure frame","building under construction",
        "obra de construção","estrutura de concreto"
    ],

    # Equipamento (pista)
    "excavator construction machine": [
        "excavator construction machine","excavator","yellow hydraulic digger","escavadeira"
    ],
}
YOLO_CLASSES = []
ALIAS_TO_CANON: Dict[str, str] = {}
for canon, aliases in CATEGORY_ALIASES.items():
    for a in aliases:
        YOLO_CLASSES.append(a)
        ALIAS_TO_CANON[a] = canon

# ========= IFC → categoria canônica =========
IFC_TO_CAT = {
    # Civil/estrutura
    "IfcColumn": "reinforced concrete column",
    "IfcBeam": "reinforced concrete beam",
    "IfcSlab": "concrete slab",
    "IfcWall": "masonry or concrete wall",
    "IfcWallStandardCase": "masonry or concrete wall",
    "IfcFooting": "concrete footing or foundation",
    "IfcPile": "concrete pile",
    "IfcReinforcingBar": "rebar",
    "IfcReinforcingMesh": "rebar mesh",
    "IfcPlate": "steel plate",
    "IfcRoof": "roof structure",
    "IfcStair": "stair",
    "IfcStairFlight": "stair",
    "IfcRamp": "ramp",
    "IfcRampFlight": "ramp",
    "IfcRailing": "railing",
    "IfcCurtainWall": "curtain wall frame",
    "IfcDiscreteAccessory": "formwork system",
    "IfcMember": "scaffold structure",
    "IfcBuildingElementProxy": "temporary construction element",

    # Ferrovia / túnel
    "IfcRail": "steel rail bar",
    "IfcTrackElement": "rail track",
    "IfcFastener": "rail fastening / clip",
    "IfcElementAssembly": "turnout / switch",
    "IfcCovering": "tunnel concrete lining segment",
    "IfcCableCarrierSegment": "cable tray",
}
MEP_IFC_TYPES = {
    "IfcPipeSegment", "IfcDuctSegment", "IfcPipeFitting", "IfcDuctFitting",
    "IfcCableCarrierSegment", "IfcDistributionChamberElement"
}
GENERIC_CUE_CANONS = {
    "generic construction cues",
    "formwork system",
    "scaffold structure",
    "excavator construction machine",
}

# ========= DB helpers =========
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caso TEXT,
        descricao TEXT,
        progress_pct REAL,
        img_path TEXT,
        ifc_path TEXT,
        uploaded_at TEXT
    )
    """)
    conn.commit()
    conn.close()
init_db()

def save_submission(caso: Optional[str], descricao: Optional[str],
                    progress_pct: float, img_path: str, ifc_path: str):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO submissions (caso, descricao, progress_pct, img_path, ifc_path, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (caso, descricao, progress_pct, img_path, ifc_path,
          datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

def get_case_row(id_: int):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, caso, descricao, progress_pct, img_path, ifc_path, uploaded_at FROM submissions WHERE id=?", (id_,))
    row = cur.fetchone()
    conn.close()
    return row

def update_case_row(id_: int, caso: Optional[str], desc: Optional[str],
                    img_path: Optional[str], ifc_path: Optional[str],
                    progress_pct: Optional[float] = None): # <-- Novo parâmetro
    row = get_case_row(id_)
    if not row: return False
    _, old_caso, old_desc, old_prog, old_img, old_ifc, up = row # Renomeado prog para old_prog
    new_caso = caso if caso is not None else old_caso
    new_desc = desc if desc is not None else old_desc
    new_img = img_path if img_path is not None else old_img
    new_ifc = ifc_path if ifc_path is not None else old_ifc
    new_prog = progress_pct if progress_pct is not None else old_prog # Usa novo progresso ou mantém o antigo

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        UPDATE submissions SET caso=?, descricao=?, progress_pct=?, img_path=?, ifc_path=? WHERE id=?
    """, (new_caso, new_desc, new_prog, new_img, new_ifc, id_)) # <-- SQL Atualizado
    conn.commit()
    conn.close()
    return True

def delete_case_row(id_: int):
    row = get_case_row(id_)
    if not row: return None
    _, _, _, _, img_path, ifc_path, _ = row
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM submissions WHERE id=?", (id_,))
    conn.commit()
    conn.close()
    return img_path, ifc_path

# ========= IFC utils =========
def elem_weight_from_qto(elem):
    try:
        if not hasattr(elem, "IsDefinedBy") or not elem.IsDefinedBy:
            return None
        for rel in elem.IsDefinedBy:
            if not rel or not rel.is_a("IfcRelDefinesByProperties"):
                continue
            prop = rel.RelatingPropertyDefinition
            if not prop:
                continue
            if prop.is_a("IfcElementQuantity"):
                qs = getattr(prop, "Quantities", None)
                if not qs:
                    continue
                vol = area = length = None
                for q in qs:
                    if q.is_a("IfcQuantityVolume") and vol is None:
                        vol = float(q.VolumeValue)
                    elif q.is_a("IfcQuantityArea") and area is None:
                        area = float(q.AreaValue)
                    elif q.is_a("IfcQuantityLength") and length is None:
                        length = float(q.LengthValue)
                if vol and vol > 0:   return vol
                if area and area > 0: return area
                if length and length > 0: return length
    except Exception:
        return None
    return None

def build_ifc_weights(ifc_path: str, ignore_mep: bool = True):
    model = ifcopenshell.open(ifc_path)
    weights_by_cat = defaultdict(float)
    totals_by_cat  = defaultdict(int)

    for ent_name, canon in IFC_TO_CAT.items():
        if ignore_mep and ent_name in MEP_IFC_TYPES:
            continue
        try:
            elems = model.by_type(ent_name)
        except Exception:
            elems = []
        if not elems:
            continue
        for e in elems:
            w = elem_weight_from_qto(e)
            if w is None:
                w = 1.0
            weights_by_cat[canon] += float(w)
            totals_by_cat[canon]  += 1

    return dict(weights_by_cat), dict(totals_by_cat)

# ========= YOLO detect (dual pass) =========
def detect_photo_dual(yolo_weights, image_path, classes,
                      conf_strict=0.22, conf_lenient=0.03, imgsz=1920):
    def run_pass(conf, augment):
        model = YOLOWorld(yolo_weights)
        model.set_classes(classes)
        res = model.predict(source=image_path, imgsz=imgsz, conf=conf, augment=augment, verbose=False)
        r = res[0]
        names = r.names
        cls = r.boxes.cls.tolist() if r.boxes and r.boxes.cls is not None else []
        cnt = defaultdict(int)
        for c in cls:
            alias = names.get(int(c), str(c))
            canon = ALIAS_TO_CANON.get(alias, alias)
            cnt[canon] += 1
        return dict(cnt)

    counts_strict  = run_pass(conf_strict,  augment=False)
    counts_lenient = run_pass(conf_lenient, augment=True)
    generic_hits = sum(k for canon, k in counts_lenient.items() if canon in GENERIC_CUE_CANONS)
    return counts_strict, counts_lenient, generic_hits

def apply_rail_prior(ratios, counts_strict, counts_lenient, boost=0.08):
    saw_track = (counts_strict.get("rail track",0)+counts_lenient.get("rail track",0) +
                 counts_strict.get("steel rail bar",0)+counts_lenient.get("steel rail bar",0)) > 0
    if not saw_track:
        return ratios
    related = ["track sleeper / tie","rail fastening / clip","turnout / switch","third rail / power rail","ballast"]
    for k in related:
        if k in ratios and ratios[k] < boost:
            ratios[k] = boost
    return ratios

def compute_progress_soft(weights_by_cat, totals_by_cat,
                          counts_strict, counts_lenient,
                          beta_lenient=0.70, eps_fallback=0.12, generic_hits=0):
    planned_weight = sum(weights_by_cat.values()) if weights_by_cat else 0.0
    if planned_weight <= 0:
        return 0.0, {}

    ratios = {}
    observed_weight = 0.0

    for cat, planned_w in weights_by_cat.items():
        total_ifc = max(totals_by_cat.get(cat, 0), 1)
        s = counts_strict.get(cat, 0)
        l = counts_lenient.get(cat, 0)
        ratio = (s + beta_lenient * l) / total_ifc
        if ratio == 0 and generic_hits > 0:
            ratio = eps_fallback
        ratio = max(0.0, min(1.0, ratio))
        ratios[cat] = ratio
        observed_weight += planned_w * ratio

    progress = 100.0 * observed_weight / planned_weight
    return progress, ratios

# ========= Helpers =========
def slugify(text: str) -> str:
    s = "".join(ch if ch.isalnum() else "_" for ch in (text or "case")).strip("_")
    return s.lower() or "case"

def _public_urls(request: Request, img_path: Optional[str], ifc_path: Optional[str]):
    base = str(request.base_url)
    img_url = None
    if img_path and os.path.exists(img_path):
        rel_img = os.path.relpath(img_path, _DB_DIR).replace(os.sep, "/")
        img_url = f"{base}files/{rel_img}"
    ifc_url = None
    if ifc_path and os.path.exists(ifc_path):
        rel_ifc = os.path.relpath(ifc_path, _DB_DIR).replace(os.sep, "/")
        ifc_url = f"{base}files/{rel_ifc}"
    return img_url, ifc_url

# ========= Create =========
@app.post("/teste")
async def teste_post(
    request: Request,
    img: UploadFile = File(...),
    ifc: UploadFile = File(...),
    ignore_mep: Optional[str] = Form("true"),
    caso: Optional[str] = Form(None),
    desc: Optional[str] = Form(None),
):
    form = await request.form()
    ignore_mep_bool = str(ignore_mep or form.get("ignore_mep") or "true").lower() in {"1","true","on","yes"}
    caso = caso or form.get("caso") or form.get("case") or ""
    desc = desc or form.get("desc") or form.get("description") or ""

    # temp
    with NamedTemporaryFile(delete=False, suffix=os.path.splitext(img.filename)[1]) as tf_img:
        shutil.copyfileobj(img.file, tf_img)
        tmp_img_path = tf_img.name
    with NamedTemporaryFile(delete=False, suffix=os.path.splitext(ifc.filename)[1]) as tf_ifc:
        shutil.copyfileobj(ifc.file, tf_ifc)
        tmp_ifc_path = tf_ifc.name

    case_dir = os.path.join(_DB_DIR, f"case_{slugify(caso)}")
    os.makedirs(case_dir, exist_ok=True)
    final_img = os.path.join(case_dir, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.path.basename(img.filename)}")
    final_ifc = os.path.join(case_dir, os.path.basename(ifc.filename))

    try:
        shutil.move(tmp_img_path, final_img)
        shutil.move(tmp_ifc_path, final_ifc)

        # IFC
        weights_by_cat, totals_by_cat = build_ifc_weights(final_ifc, ignore_mep=ignore_mep_bool)
        if not weights_by_cat:
            save_submission(caso, desc, 0.0, final_img, final_ifc)
            img_url, ifc_url = _public_urls(request, final_img, final_ifc)
            return JSONResponse({
                "progress_pct": 0.0,
                "message": "Nenhum elemento do IFC mapeado às categorias.",
                "weights_by_cat": {}, "totals_by_cat": {}, "ratios": {}, "counts": {},
                "img_path": img_url, "ifc_path": ifc_url, "caso": caso, "desc": desc
            })

        # YOLO dual
        counts_strict, counts_lenient, generic_hits = detect_photo_dual(
            YOLO_WEIGHTS, final_img, YOLO_CLASSES, conf_strict=0.22, conf_lenient=0.03, imgsz=1920
        )
        progress_pct, ratios = compute_progress_soft(
            weights_by_cat, totals_by_cat, counts_strict, counts_lenient,
            beta_lenient=0.70, eps_fallback=0.12, generic_hits=generic_hits
        )
        ratios = apply_rail_prior(ratios, counts_strict, counts_lenient, boost=0.08)
        progress_pct = round(progress_pct, 1)

        save_submission(caso, desc, float(progress_pct), final_img, final_ifc)
        img_url, ifc_url = _public_urls(request, final_img, final_ifc)

        return JSONResponse({
            "progress_pct": progress_pct,
            "weights_by_cat": weights_by_cat,
            "totals_by_cat": totals_by_cat,
            "ratios": ratios,
            "img_path": img_url, "ifc_path": ifc_url,
            "caso": caso, "desc": desc
        })
    finally:
        for p in (tmp_img_path, tmp_ifc_path):
            try: os.remove(p)
            except: pass

# ========= Read list =========
@app.get("/casos")
async def list_casos(request: Request):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, caso, descricao, progress_pct, img_path, ifc_path, uploaded_at
            FROM submissions
            ORDER BY uploaded_at DESC
        """)
        rows = cur.fetchall()
        cases = []
        for (id_, caso, descricao, progress_pct, img_path, ifc_path, uploaded_at) in rows:
            try:
                dt = datetime.fromisoformat(uploaded_at.replace("Z","+00:00"))
                formatted_date = dt.strftime("%d/%m/%Y")
            except Exception:
                formatted_date = uploaded_at
            img_url, ifc_url = _public_urls(request, img_path, ifc_path)
            cases.append({
                "id": id_,
                "caso": caso or "Sem nome",
                "descricao": descricao or "Sem descrição",
                "progress_pct": float(f"{float(progress_pct):.2f}"),
                "img_path": img_url,
                "ifc_path": ifc_url,
                "data": formatted_date,
                "uploaded_at_iso": uploaded_at,
            })
        return {"cases": cases}
    finally:
        conn.close()

# ========= Read single =========
@app.get("/casos/{id}")
async def get_caso(id: int, request: Request):
    row = get_case_row(id)
    if not row:
        raise HTTPException(404, "Caso não encontrado")
    id_, caso, descricao, progress_pct, img_path, ifc_path, uploaded_at = row
    img_url, ifc_url = _public_urls(request, img_path, ifc_path)
    return {
        "id": id_,
        "caso": caso, "descricao": descricao,
        "progress_pct": progress_pct,
        "img_path": img_url, "ifc_path": ifc_url,
        "uploaded_at_iso": uploaded_at,
    }

# ========= Update =========
@app.put("/casos/{id}")
async def update_caso(
    id: int,
    request: Request,
    img: Optional[UploadFile] = File(None),
    ifc: Optional[UploadFile] = File(None),
    ignore_mep: Optional[str] = Form("true"), # Capturar para recalculo
    caso: Optional[str] = Form(None),
    desc: Optional[str] = Form(None),
):
    form = await request.form()
    ignore_mep_bool = str(ignore_mep or form.get("ignore_mep") or "true").lower() in {"1","true","on","yes"}

    row = get_case_row(id)
    if not row:
        raise HTTPException(404, "Caso não encontrado")
    _, old_caso, _, old_prog, old_img, old_ifc, _ = row

    # Pasta do caso
    use_name = caso if (caso and caso.strip()) else old_caso or "case"
    case_dir = os.path.join(_DB_DIR, f"case_{slugify(use_name)}")
    os.makedirs(case_dir, exist_ok=True)

    new_img_path = None
    new_ifc_path = None
    
    # Flag para recalcular
    recalculate = False
    
    # Salva novos arquivos se enviados, replicando a lógica de /teste para temporários e permanentes
    if img is not None and img.filename:
        with NamedTemporaryFile(delete=False, suffix=os.path.splitext(img.filename)[1]) as tf:
            shutil.copyfileobj(img.file, tf)
            tmp = tf.name
        final_img = os.path.join(case_dir, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.path.basename(img.filename)}")
        shutil.move(tmp, final_img)
        new_img_path = final_img
        recalculate = True
    
    if ifc is not None and ifc.filename:
        with NamedTemporaryFile(delete=False, suffix=os.path.splitext(ifc.filename)[1]) as tf:
            shutil.copyfileobj(ifc.file, tf)
            tmp = tf.name
        final_ifc = os.path.join(case_dir, os.path.basename(ifc.filename))
        shutil.move(tmp, final_ifc)
        new_ifc_path = final_ifc
        recalculate = True

    # --- Lógica de Recálculo ---
    updated_progress_pct = None
    
    if recalculate:
        # Determina os caminhos a usar (novo arquivo ou o antigo)
        calc_img_path = new_img_path if new_img_path else old_img
        calc_ifc_path = new_ifc_path if new_ifc_path else old_ifc
        
        try:
            # 1. Pesos IFC
            weights_by_cat, totals_by_cat = build_ifc_weights(calc_ifc_path, ignore_mep=ignore_mep_bool)
            
            if weights_by_cat:
                # 2. Detecção YOLO
                counts_strict, counts_lenient, generic_hits = detect_photo_dual(
                    YOLO_WEIGHTS, calc_img_path, YOLO_CLASSES, conf_strict=0.22, conf_lenient=0.03, imgsz=1920
                )
                
                # 3. Calcular progresso
                progress_pct, ratios = compute_progress_soft(
                    weights_by_cat, totals_by_cat, counts_strict, counts_lenient,
                    beta_lenient=0.70, eps_fallback=0.12, generic_hits=generic_hits
                )
                ratios = apply_rail_prior(ratios, counts_strict, counts_lenient, boost=0.08)
                updated_progress_pct = round(progress_pct, 1)

            else:
                updated_progress_pct = 0.0 # Nenhum elemento mapeado no IFC
                
        except Exception as e:
            # Em caso de falha no recálculo, mantém o progresso antigo
            print(f"Erro durante o recálculo de progresso para o caso {id}: {e}")
            # updated_progress_pct = None will default to old_prog in update_case_row if not set
    
    # Atualiza o banco de dados
    ok = update_case_row(id, caso, desc, new_img_path, new_ifc_path, updated_progress_pct)
    if not ok:
        raise HTTPException(500, "Falha ao atualizar")

    # Retorna a linha atualizada (agora com o novo progress_pct)
    row2 = get_case_row(id)
    _, caso2, desc2, prog2, img2, ifc2, up2 = row2
    img_url, ifc_url = _public_urls(request, img2, ifc2)
    return {
        "id": id,
        "caso": caso2, "descricao": desc2,
        "progress_pct": prog2,
        "img_path": img_url, "ifc_path": ifc_url,
        "uploaded_at_iso": up2,
    }

# ========= Delete =========
@app.delete("/casos/{id}")
async def delete_caso(id: int):
    deleted = delete_case_row(id)
    if deleted is None:
        raise HTTPException(404, "Caso não encontrado")
    img_path, ifc_path = deleted
    # opcional: deletar arquivos no disco
    for p in (img_path, ifc_path):
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except:
            pass
    return {"ok": True, "id": id}

# =====================
# SEÇÃO: SEED DE CASOS DE TESTE
# =====================
@app.post("/seed")
async def seed_cases():
    os.makedirs(os.path.join(_DB_DIR, "seed"), exist_ok=True)
    img_file = os.path.join(_DB_DIR, "seed", "placeholder.png")
    ifc_file = os.path.join(_DB_DIR, "seed", "placeholder.ifc")

    # PNG 1x1 branco (base64)
    PNG_1x1_B64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQAB"
        "J4pjSAAAAABJRU5ErkJggg=="
    )
    if not os.path.exists(img_file):
        with open(img_file, "wb") as f:
            f.write(base64.b64decode(PNG_1x1_B64))
    if not os.path.exists(ifc_file):
        with open(ifc_file, "w", encoding="utf-8") as f:
            f.write("ISO-10303-21;\\nEND-ISO-10303-21;")

    def add(caso, desc, progress, dt):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO submissions (caso, descricao, progress_pct, img_path, ifc_path, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (caso, desc, progress, img_file, ifc_file, dt.isoformat()))
        conn.commit()
        conn.close()

    now = datetime.now(timezone.utc)
    add("Túnel Leste", "Foto inspeção matinal", 32.4, now - timedelta(hours=2))
    add("Pátio AMV", "Instalação de trilhos",   57.8, now - timedelta(hours=5))
    add("Estação Y",  "Laje de plataforma",     12.0, now - timedelta(hours=9))
    add("Galeria X",  "Revestimento segmentos", 44.0, now - timedelta(hours=18))
    add("Poço Z",     "Concretagem bloco",      21.6, now - timedelta(days=5))
    add("Sala Técnica","Bandeja de cabos",      66.0, now - timedelta(days=35))

    return {"ok": True}
