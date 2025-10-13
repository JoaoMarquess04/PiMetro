from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLOWorld
import tempfile, shutil

app = FastAPI()

# cors pra permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


model = YOLOWorld("yolov8s-worldv2.pt")
model.set_classes([
    "concrete column", "concrete beam", "slab", "wall", "formwork",
    "rail track", "rail", "sleeper",
    "hard hat", "safety vest", "person",
    "excavator", "crane", "scaffold"
    ])

@app.post("/analyze") # endpoint que recebe a imagem e retorna as deteccoes
async def analyze(file: UploadFile = File(...)):
    # salva o upload em arquivo temporario pro yolo ler
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        img_path = tmp.name

    # roda a predicao
    results = model.predict(img_path, verbose=False)
    r = results[0]

    r.show()  # so pra testar, dps vamos tirar

    # conta quantas deteccoes por classe
    names = r.names  # dict: id, nome da classe
    cls_idxs = r.boxes.cls.tolist() if r.boxes is not None and r.boxes.cls is not None else []
    counts = {}
    for idx in cls_idxs:
        name = names.get(int(idx), str(idx))
        counts[name] = counts.get(name, 0) + 1

    return {
        "total_detections": len(cls_idxs),
        "counts": counts,
        "concrete_beam_count": counts.get("concrete beam", 0)
    }