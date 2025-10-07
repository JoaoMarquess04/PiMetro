from ultralytics import YOLOWorld

model = YOLOWorld("yolov8s-worldv2.pt")

model.set_classes([
    "concrete column", "concrete beam", "slab", "wall", "formwork",
    "rail track", "rail", "sleeper",
    "hard hat", "safety vest", "person",
    "excavator", "crane", "scaffold"
    ])

results = model.predict('') # coloca o path da imagem

results[0].show()