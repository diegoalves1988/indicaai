# Escopo do App: Service Recommendation  

## 🎯 Objetivo  
Conectar usuários a profissionais qualificados através de um sistema de indicações verificadas e categorizadas.  

---

## 📆 Versão Atual: v1.0  
### ✅ Funcionalidades Implementadas  
- Cadastro de profissionais  
- Sistema de recomendação  
- Perfil público básico  

---

## 🚀 Roadmap  
### 🔥 Prioridade Alta (v1.1)  
- **Filtro por localização**  
  - Raio de busca ajustável  
  - Ordenação por proximidade  

- **Sistema de categorias e especialidades**  
  - Categorias pré-definidas (obrigatório)  
  - Especialidades múltiplas (opcional)  
  - Migração automática de profissionais existentes  

### 🌟 Ideias Futuras  
- Confirmação por SMS  
- Upload de portfólio (fotos/vídeos)  
- Sistema de certificação verificada  

---

## 🏗️ Arquitetura de Classificação  
### 📋 Categorias e Especialidades  
| Categoria         | Especialidades                              | Regras                          |
|-------------------|--------------------------------------------|---------------------------------|
| **Construção**    | Pedreiro, Encanador, Eletricista           | 1+ especialidade obrigatória    |
| **Serviços**      | Diarista, Jardineiro, Organizador          | Pode ter até 5 especialidades   |
| **Tecnologia**    | Montagem de PC, Instalação de Câmeras      |                                 |

### 🔧 Regras de Negócio  
1. **Hierarquia fixa**: Categorias só podem ser adicionadas pelo admin.  
2. **Sugestões**: Usuários podem propor novas especialidades (aprovadas manualmente).  
3. **Múltiplas especialidades**: Ex: "Eletricista + Instalador de Câmeras".  

---

## ⚠️ Limitações Atuais  
- **Integrações**:  
  - Não possui Google Maps  
  - Sem validação automática de certificados  
- **UI**:  
  - Seleção de categorias não é persistente em drafts  

---

## 📌 Decisões de Design  
- **Não usar avaliação por estrelas**: Foco em recomendações qualitativas.  
- **Especialidades aninhadas**: Para evitar poluição visual.  