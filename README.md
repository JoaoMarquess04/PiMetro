## Instruções de Instalação

### 1. Clone o repositório com a branch de back-end
```bash
git clone --single-branch --branch back https://github.com/JoaoMarquess04/PiMetro.git PiMetro-back
```

### 2. Acesse a pasta do projeto
```bash
cd PiMetro-back
```

### 3. Configure o ambiente virtual do Python (recomendado)

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

### 4. Instale as dependências do backend (por enquanto ultralytics)
```bash
pip install ultralytics
```
### 5. Rodar o arquivo
#### Crie uma pasta para as imagens, se quiser, e coloque o path da imagem no main.py 
```bash
python main.py
```
