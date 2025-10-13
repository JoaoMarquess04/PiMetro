# PiMetro

O trabalho propõe o desenvolvimento de um protótipo de sistema multiplataforma, baseado em **visão computacional** e **inteligência artificial**, para o **monitoramento automatizado de canteiros de obras do Metrô de São Paulo**. 

A proposta busca **modernizar o processo de fiscalização**, atualmente dependente de métodos analógicos e verificações presenciais, por meio da **integração entre modelagem BIM**, **captura de realidade** e **análise visual assistida por machine learning**.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/en/download/)

---

## 🚀 Instruções de Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/JoaoMarquess04/PiMetro.git
```

### 2. Acesse a pasta do projeto
```bash
cd PiMetro
```

### 3. Instale as dependências do frontend
```bash
npm install
```

### 4. Configure o ambiente virtual do Python (recomendado)

#### Linux / Mac
```bash
cd back_end
python -m venv venv
source venv/bin/activate
```
#### Windows
```bash
cd back_end
python -m venv venv
venv\Scripts\activate
```

### 5. Instale as dependências do backend 
```bash
pip install -r ..\requirements.txt
```

### 6. Rodar o arquivo
```bash
python main.py
```

### 7. Inicie a aplicação web
```bash
cd ..
npm run dev
```
