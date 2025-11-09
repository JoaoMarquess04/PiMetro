from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import math
from typing import List, Optional
from tempfile import NamedTemporaryFile
from collections import defaultdict
import shutil
import os
import sqlite3
from datetime import datetime

# IFC
import ifcopenshell

# YOLO-World
from ultralytics import YOLOWorld


app = FastAPI(title="IFC x Foto - Andamento de Obra (Metrô/Obras Civis)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the db directory to serve uploaded files
app.mount("/files", StaticFiles(directory="db"), name="files")

# ===============================
# 1) Categorias e Aliases (PT/EN)
# ===============================
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
    "rail track": [
        "rail track","railway track","track superstructure","via férrea","trilho montado"
    ],
    "steel rail bar": [
        "steel rail bar","rail bar","rail section","trilho","barra de trilho"
    ],
    "track sleeper / tie": [
        "railway sleeper","track sleeper","rail tie","dormente","travessa"
    ],
    "rail fastening / clip": [
        "rail fastening","rail clip","pandrol clip","fixação de trilho","grampo de trilho"
    ],
    "turnout / switch": [
        "rail turnout","railway switch","track switch","AMV","aparelho de mudança de via"
    ],
    "ballast": ["track ballast","ballast bed","brita da via","lastro"],
    "third rail / power rail": [
        "third rail","power rail","trilho de alimentação","barra condutora"
    ],
    "tunnel concrete lining segment": [
        "tunnel concrete lining","tunnel lining segment","concrete tunnel ring",
        "segmento de túnel","anel de túnel","revestimento de túnel"
    ],
    "cable tray": ["cable tray","cable carrier","bandeja de cabos"],
    "overhead cable / catenary support": [
        "overhead cable support","catenary support bracket","electrical conduit run",
        "suporte de cabos","suporte de catenária","eletroduto aparente"
    ],

    # Pistas genéricas (para fallback ε)
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
ALIAS_TO_CANON = {}
for canon, aliases in CATEGORY_ALIASES.items():
    for a in aliases:
        YOLO_CLASSES.append(a)
        ALIAS_TO_CANON[a] = canon

# ===========================================
# 2) IFC2x3 -> categoria canônica (túnel/via)
# ===========================================
IFC_TO_CAT = {
    # Civil/estrutura
    "IfcColumn": "reinforced concrete column",
    "IfcBeam": "reinforced concrete beam",               # trilhos/soleiras às vezes modelados como Beam/Member
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
    "IfcFastener": "rail fastening / clip",              # fixações
    "IfcElementAssembly": "turnout / switch",            # AMV
    "IfcCovering": "tunnel concrete lining segment",     # revestimento de túnel
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

# =========================
# 3) Util: QtO (peso)
# =========================
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

def build_ifc_weights(ifc_paths, ignore_mep=True):
    """Recebe 1 ou + arquivos IFC. Soma pesos/contagens por categoria."""
    if isinstance(ifc_paths, str):
        ifc_paths = [ifc_paths]

    weights_by_cat = defaultdict(float)
    totals_by_cat  = defaultdict(int)

    for ifc_path in ifc_paths:
        model = ifcopenshell.open(ifc_path)

        for ent_name, canon in IFC_TO_CAT.items():
            try:
                elems = model.by_type(ent_name)
            except Exception:
                elems = []
            if not elems:
                continue

            if ignore_mep and ent_name in MEP_IFC_TYPES:
                continue

            for e in elems:
                w = elem_weight_from_qto(e)
                if w is None:
                    w = 1.0
                weights_by_cat[canon] += float(w)
                totals_by_cat[canon]  += 1

    return dict(weights_by_cat), dict(totals_by_cat)

# ==========================================
# 4) YOLO: dois passes (estrito + leniente)
# ==========================================
def detect_photo_dual(yolo_weights, image_path, classes, conf_strict=0.22, conf_lenient=0.03, imgsz=1920):
    """Retorna counts_strict, counts_lenient e generic_hits (por categoria canônica)."""
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

# ==========================================
# 5) Prior ferroviário + progresso suave
# ==========================================
def apply_rail_prior(ratios, counts_strict, counts_lenient, boost=0.08):
    saw_track = (counts_strict.get("rail track",0)+counts_lenient.get("rail track",0) +
                 counts_strict.get("steel rail bar",0)+counts_lenient.get("steel rail bar",0)) > 0
    if not saw_track:
        return ratios
    related = [
        "track sleeper / tie",
        "rail fastening / clip",
        "turnout / switch",
        "third rail / power rail",
        "ballast"
    ]
    for k in related:
        if k in ratios and ratios[k] < boost:
            ratios[k] = boost
    return ratios

def compute_progress_soft(weights_by_cat, totals_by_cat,
                          counts_strict, counts_lenient,
                          beta_lenient=0.70, eps_fallback=0.12, generic_hits=0):
    """
    ratio_cat = clamp((strict + β*lenient)/total_IFC_cat  ou ε se generic_hits>0, 0..1)
    """
    planned_weight = sum(weights_by_cat.values()) if weights_by_cat else 0.0
    if planned_weight <= 0:  # sem denominador
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


def _sanitize_table_name(name: str) -> str:
    """Return a safe table/folder name derived from the case name.
    Keep only alphanumeric and underscore, lowercase. Prefix with 'case_' to ensure it starts with a letter.
    """
    if not name:
        name = f"unnamed_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    safe = ''.join(c if (c.isalnum() or c == '_') else '_' for c in name)
    safe = safe.strip('_')
    if not safe:
        safe = 'case'
    return f"case_{safe.lower()}"


def save_submission_record(caso: Optional[str], desc: Optional[str], progress_pct: float, img_src: str, ifc_src: str):
    """Ensure db folder and sqlite database exist, copy files into a case folder and insert a row into a table named after the case.
    Returns the destination file paths (img_dst, ifc_dst) and the table name used.
    """
    # Base db directory (next to this file)
    base_dir = os.path.dirname(__file__)
    db_dir = os.path.join(base_dir, 'db')
    os.makedirs(db_dir, exist_ok=True)

    # Database file
    db_file = os.path.join(db_dir, 'database.db')

    # Create case folder and copy files (keep per-case folder for file storage)
    table_name = 'submissions'
    case_folder_name = _sanitize_table_name(caso or '')
    case_folder = os.path.join(db_dir, case_folder_name)
    os.makedirs(case_folder, exist_ok=True)

    img_dst = os.path.join(case_folder, os.path.basename(img_src))
    ifc_dst = os.path.join(case_folder, os.path.basename(ifc_src))
    try:
        shutil.copyfile(img_src, img_dst)
    except Exception:
        # if copy fails, still proceed (we'll store original path)
        img_dst = img_src
    try:
        shutil.copyfile(ifc_src, ifc_dst)
    except Exception:
        ifc_dst = ifc_src

    # Create DB and a single submissions table if needed, then insert a row
    conn = sqlite3.connect(db_file)
    try:
        cur = conn.cursor()
        # Create a single table to store all submissions
        create_sql = """
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caso TEXT,
            descricao TEXT,
            progress_pct REAL,
            img_path TEXT,
            ifc_path TEXT,
            uploaded_at TEXT
        )
        """
        cur.executescript(create_sql)

        # Insert the record
        insert_sql = "INSERT INTO submissions (caso, descricao, progress_pct, img_path, ifc_path, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)"
        uploaded_at = datetime.utcnow().isoformat() + 'Z'
        cur.execute(insert_sql, (
            caso,
            desc,
            float(progress_pct),
            img_dst,
            ifc_dst,
            uploaded_at
        ))
        conn.commit()
    finally:
        conn.close()

    return img_dst, ifc_dst, 'submissions'


# ==========================
# 6) FastAPI endpoints
# ==========================

# carrega o peso uma vez (pode alterar por env)
YOLO_WEIGHTS = os.getenv("YOLOWORLD_WEIGHTS", "yolov8x-worldv2.pt")

# Ensure db directory and a SQL schema file exist (provide a human-readable SQL file named `database.sql`).
_BASE_DIR = os.path.dirname(__file__)
_DB_DIR = os.path.join(_BASE_DIR, 'db')
os.makedirs(_DB_DIR, exist_ok=True)
_SQL_FILE = os.path.join(_DB_DIR, 'database.sql')
if not os.path.exists(_SQL_FILE):
    with open(_SQL_FILE, 'w', encoding='utf-8') as _f:
        _f.write("""
-- Schema for submissions table (created automatically by the app if missing)
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caso TEXT,
    descricao TEXT,
    progress_pct REAL,
    img_path TEXT,
    ifc_path TEXT,
    uploaded_at TEXT
);
""")

@app.post("/teste")
async def teste_post(
    img: UploadFile = File(...),
    ifc: UploadFile = File(...),
    caso: Optional[str] = Form(None),
    desc: Optional[str] = Form(None),
    ignore_mep: bool = Form(True),
):
    # Caso e desc são lidos diretamente como campos de formulário via Form params.
    # Normaliza booleano do checkbox
    ignore_mep_bool = bool(ignore_mep)

    # Salvar arquivos temporariamente
    with NamedTemporaryFile(delete=False, suffix=os.path.splitext(img.filename)[1]) as tf_img:
        shutil.copyfileobj(img.file, tf_img)
        img_path = tf_img.name
    with NamedTemporaryFile(delete=False, suffix=os.path.splitext(ifc.filename)[1]) as tf_ifc:
        shutil.copyfileobj(ifc.file, tf_ifc)
        ifc_path = tf_ifc.name

    try:
        # 1) IFC -> pesos/totais
        weights_by_cat, totals_by_cat = build_ifc_weights(ifc_path, ignore_mep=ignore_mep)

        # Se o IFC não tiver nada mapeado, retorna cedo
        if not weights_by_cat:
            return JSONResponse({
                "progress_pct": 0.0,
                "message": "Nenhum elemento do IFC mapeado às categorias conhecidas.",
                "weights_by_cat": {},
                "ratios": {},
                "counts": {}
            })

        # 2) YOLO (dois passes)
        counts_strict, counts_lenient, generic_hits = detect_photo_dual(
            YOLO_WEIGHTS, img_path, YOLO_CLASSES,
            conf_strict=0.22, conf_lenient=0.03, imgsz=1920
        )

        # 3) Progresso suave + prior ferroviário
        progress_pct, ratios = compute_progress_soft(
            weights_by_cat, totals_by_cat,
            counts_strict, counts_lenient,
            beta_lenient=0.70, eps_fallback=0.12, generic_hits=generic_hits
        )
        ratios = apply_rail_prior(ratios, counts_strict, counts_lenient, boost=0.08)

        # Resumo simples de contagens (já agregadas por categoria canônica)
        counts = {
            "strict": counts_strict,
            "lenient": counts_lenient,
            "generic_hits": generic_hits
        }

        # Persist submission: copy files into db/<case>/ and record into sqlite
        try:
            img_saved, ifc_saved, table_name = save_submission_record(caso, desc, progress_pct, img_path, ifc_path)
        except Exception as e:
            # If persistence fails, log and continue returning the main response
            img_saved, ifc_saved, table_name = None, None, None

        return JSONResponse({
            "progress_pct": float(f"{progress_pct:.2f}"),
            "weights_by_cat": weights_by_cat,
            "totals_by_cat": totals_by_cat,
            "ratios": ratios,
            "counts": counts,
            "ifc_file": ifc.filename,
            "img_file": img.filename,
            "img_saved": img_saved,
            "ifc_saved": ifc_saved,
            "table": table_name,
            "caso": caso,
            "desc": desc,
            "ignore_mep": ignore_mep_bool,
        })

    finally:
        # limpeza
        try:
            os.remove(img_path)
        except Exception:
            pass
        try:
            os.remove(ifc_path)
        except Exception:
            pass

@app.get("/casos")
async def list_casos():
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), "db", "database.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all cases ordered by uploaded_at descending (newest first)
        cursor.execute("""
            SELECT id, caso, descricao, progress_pct, img_path, ifc_path, uploaded_at 
            FROM submissions 
            ORDER BY uploaded_at DESC
        """)
        
        rows = cursor.fetchall()
        cases = []
        
        for row in rows:
            id, caso, descricao, progress_pct, img_path, ifc_path, uploaded_at = row
            # Format date for display (original format: 2025-11-09T14:30:00Z)
            try:
                dt = datetime.fromisoformat(uploaded_at.replace('Z', '+00:00'))
                formatted_date = dt.strftime('%d/%m/%Y')
            except:
                formatted_date = uploaded_at
                
            # Format progress to 2 decimal places and convert paths to URLs
            formatted_progress = float(f"{progress_pct:.2f}")
            
            # Convert local paths to URLs
            img_url = f"/files/{os.path.relpath(img_path, 'db')}" if img_path and os.path.exists(img_path) else None
            ifc_url = f"/files/{os.path.relpath(ifc_path, 'db')}" if ifc_path and os.path.exists(ifc_path) else None
            
            cases.append({
                "id": id,
                "caso": caso or "Sem nome",
                "descricao": descricao or "Sem descrição",
                "progress_pct": formatted_progress,
                "img_path": img_url,
                "ifc_path": ifc_url,
                "data": formatted_date
            })
            
        return {"cases": cases}
        
    finally:
        conn.close()