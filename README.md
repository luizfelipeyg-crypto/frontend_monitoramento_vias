# Monitoramento de Vias Públicas

**Front-End do sistema de Detecção Inteligente de Sinalizações Viárias**

Projeto Integrador desenvolvido no contexto acadêmico da UTFPR, com o objetivo de fornecer uma interface para monitoramento de vias públicas, visualização de análises de vídeos e acompanhamento de detecções de sinalizações viárias.

## Sobre o projeto

O sistema propõe uma plataforma de monitoramento que permite acompanhar análises de vídeos de vias públicas, visualizar sinalizações detectadas e consultar informações relacionadas aos resultados do processamento.

O Front-End foi desenvolvido para oferecer uma interface administrativa intuitiva, organizada e responsiva, facilitando o acesso às informações e a interação com os recursos do sistema.

## Objetivos

- Desenvolver uma interface para monitoramento e análise de vídeos de vias públicas.
- Facilitar a visualização de sinalizações viárias detectadas.
- Apresentar indicadores, gráficos e relatórios relacionados às análises.
- Permitir a revisão e classificação das detecções.
- Integrar a interface com a API responsável pelo processamento e armazenamento dos dados.

## Tecnologias utilizadas

- **HTML5** — estrutura das páginas.
- **CSS3** — estilização, layout e responsividade.
- **JavaScript** — interatividade, navegação e manipulação dos dados.
- **Fetch API** — comunicação com o back-end.
- **XMLHttpRequest** — envio de vídeos com acompanhamento do progresso.
- **Google Fonts — IBM Plex Sans** — tipografia da interface.
- **Git e GitHub** — versionamento e hospedagem do código-fonte.

## ✨ Funcionalidades

### 📊 Visão geral
- Indicadores resumidos das análises e detecções.
- Visualização de gráficos e distribuição por classe.
- Listagem de análises recentes.

### 🔎 Análises
- Consulta das análises registradas.
- Pesquisa por vídeo, identificação ou localização.
- Filtros por status e localização.
- Paginação dos resultados.

### 🎥 Envio de vídeos
- Seleção de arquivos e suporte a arrastar e soltar.
- Validação de formato, tamanho e duração.
- Informações sobre a localização do vídeo.
- Acompanhamento do progresso real do envio.
- Acesso aos detalhes da análise após o envio, conforme a resposta da API.

### 🚧 Detalhes e revisão
- Visualização dos metadados da análise.
- Exibição das detecções e dos respectivos níveis de confiança.
- Reprodução do vídeo, quando disponível.
- Visualização de caixas delimitadoras sobre o vídeo, quando os dados necessários são fornecidos.
- Recursos para confirmar, rejeitar ou corrigir detecções, conforme suporte do back-end.
- Consulta de ocorrências e prioridades.

### 📑 Relatórios
- Consulta de indicadores e resultados agregados.
- Filtros para consulta dos dados.
- Exportação de informações em formato CSV.

### ⚙️ Configurações
- Preferências de paginação.
- Configuração de classes utilizadas pela interface.
- Verificação do estado de conexão com a API.

> **Observação:** a disponibilidade efetiva de cada funcionalidade depende da implementação correspondente e da integração com o back-end.

## 📁 Estrutura do projeto

```text
frontend_monitoramento_vias/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── api.js
│   └── app.js
└── README.md
```

- `index.html`: estrutura principal da aplicação.
- `css/style.css`: estilos e regras de responsividade.
- `js/api.js`: configuração e comunicação com a API.
- `js/app.js`: navegação, renderização das páginas e interações.
- `README.md`: documentação do projeto.

## 🚀 Como executar

### Pré-requisitos

- Navegador atualizado.
- Visual Studio Code (recomendado).
- Extensão Live Server ou outro servidor HTTP local.
- Back-end configurado e em execução para testar as funcionalidades que dependem da API.

### 1. Clonar o repositório

```bash
git clone https://github.com/luizfelipeyg-crypto/frontend_monitoramento_vias.git
```

### 2. Entrar na pasta do projeto

```bash
cd frontend_monitoramento_vias
```

### 3. Abrir no Visual Studio Code

```bash
code .
```

### 4. Executar a aplicação

Abra o arquivo `index.html` com a extensão **Live Server** no Visual Studio Code.

A interface poderá ser acessada pelo endereço local fornecido pela extensão.

## 🔌 Integração com o back-end

A comunicação com a API está centralizada em `js/api.js`.

A URL base pode ser configurada pela variável `CONFIG.API_URL`, cujo valor padrão é:

```javascript
http://localhost:8000
```

Para utilizar outro endereço, ajuste a configuração conforme o ambiente de execução e o contrato definido pela equipe responsável pelo back-end.

Os endpoints e formatos de resposta devem corresponder à implementação real da API. Recursos que dependem do servidor não funcionarão completamente enquanto ele estiver indisponível ou não estiver configurado.

**Importante:** ao publicar a interface na internet, configure a URL de uma API acessível externamente e as permissões necessárias de CORS. O endereço `localhost` representa a própria máquina de quem está acessando a aplicação.

## 👥 Desenvolvimento

Este repositório concentra o código-fonte do **Front-End** do sistema.

## 🎓 Contexto acadêmico

**Projeto Integrador — UTFPR**

**Tema:** Monitoramento de Vias Públicas e Detecção Inteligente de Sinalizações Viárias.

