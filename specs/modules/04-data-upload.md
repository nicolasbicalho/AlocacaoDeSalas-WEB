# Módulo 4 — Cadastro de Dados Base (Upload)

**Status:** `draft`
**Depende de:** Módulo 3 (Projects)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/04-data-upload.md` (a ser criado)

---

## Visão Geral

O coordinator importa os dados base de um projeto via upload de arquivo (`.csv` ou `.xlsx`): prédios, salas e turmas. Cada tipo de dado tem seu próprio endpoint e template de arquivo. A tela apresenta o progresso do upload e os erros por linha quando existirem.

---

## Estrutura do Módulo

```
modules/dataUpload/
├── views/
│   └── DataUploadView.vue
├── components/
│   ├── UploadSection.vue        # Seção reutilizável por tipo de dado
│   ├── UploadDropzone.vue       # Área de drag-and-drop
│   ├── UploadResultTable.vue    # Exibe erros de importação por linha
│   └── UploadSummary.vue        # Resumo: importados, com erro
├── services/
│   └── dataUpload.service.ts
└── index.ts
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:id/upload` | `DataUploadView` | `coordinator` |

---

## 5.1 Tela de Upload de Dados (`DataUploadView`)

### Layout

- Breadcrumb: "Projetos / {nome} / Importar Dados"
- Três seções empilhadas verticalmente, uma por tipo de dado:
  1. **Prédios e Salas** (`buildings`)
  2. **Turmas** (`classes`)
- Cada seção tem:
  - Título e descrição do tipo de dado
  - Link para download do template de arquivo
  - `UploadDropzone` — aceita drag-and-drop ou seleção de arquivo
  - Estado após upload: `UploadSummary` + `UploadResultTable` (erros)

### `UploadDropzone`

- Aceita `.csv` e `.xlsx`
- Tamanho máximo: 10 MB
- Estados visuais: ocioso, hover com arquivo, carregando, sucesso, erro

### `UploadSummary`

Exibe após importação:
- "42 registros importados com sucesso"
- "3 registros com erro" (clicável para expandir `UploadResultTable`)

### `UploadResultTable`

Tabela de erros com colunas: Linha, Campo, Mensagem de erro.

### Comportamento

1. Usuário arrastra ou seleciona um arquivo
2. Clica em "Importar"
3. Exibe loading/progress na `UploadDropzone`
4. API processa e retorna `{ imported: N, errors: [{row, message}] }`
5. Exibe `UploadSummary` e, se houver erros, `UploadResultTable`
6. Usuário pode tentar novamente sem recarregar a página

### Templates

Links para download dos templates ficam em arquivos estáticos (`public/templates/`):
- `template-buildings.csv`
- `template-classes.csv`

### Chamadas à API

```
POST /projects/:id/upload/buildings
Content-Type: multipart/form-data
Body: { file: File }

POST /projects/:id/upload/classes
Content-Type: multipart/form-data
Body: { file: File }
```

Response:
```json
{
  "success": true,
  "data": {
    "imported": 42,
    "errors": [
      { "row": 3, "message": "Capacidade inválida" }
    ]
  }
}
```

---

## Critérios de Aceitação

- [ ] Arquivo `.csv` válido é importado e exibe resumo de sucesso
- [ ] Arquivo com erros em algumas linhas exibe quais linhas falharam
- [ ] Arquivo com formato inválido (não `.csv`/`.xlsx`) é rejeitado antes do upload
- [ ] Arquivo maior que 10 MB é rejeitado com mensagem clara
- [ ] É possível fazer upload novamente após um resultado parcial
- [ ] Links de template baixam os arquivos corretos
- [ ] Apenas coordinator acessa a tela (professor e admin não veem o menu de upload)
