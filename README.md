# Service Recommendation App 🔍  

[![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)  
[![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactnative.dev)  

> Plataforma pessoal para indicação de profissionais confiáveis  


## 🛠️ Stack  
- **Frontend**: React Native (Expo)  
- **Backend**: Firebase (Firestore, Auth)  
- **Estilo**: TailwindCSS (NativeWind)  (Não implementado ainda)

## 📌 Roadmap  
- **v1.0**: MVP com cadastro e recomendações  
- **v1.1**: Filtro por localização (já implementado)  
- **v1.2**: Categorias/especialidades profissionais 
- **v1.3**: Melhora no login (confirmação de e-mail) 


## 📌 Backlog
- Login com Google
- Melhorar interface da home, tela de login, criar conta e esqueci senha
- Otimizar o CSS
- Excluir perfil profissional
- Excluir conta do usuário

[Detalhes do escopo](/docs/scope.md)  
[Publicar na Play Store](/docs/publishing-play-store.md)  

## 🔧 Configuração do Firebase Storage (CORS)

Para que o upload de imagens funcione na versão web (Expo Web / localhost), é necessário configurar o CORS no bucket do Firebase Storage. Execute o comando abaixo **uma única vez**:

```bash
gsutil cors set cors.json gs://service-recommendation-app.appspot.com
```

> **Pré-requisito**: ter o [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) instalado e autenticado com `gcloud auth login`.

O arquivo `cors.json` na raiz do projeto já contém as origens permitidas (localhost:8081, localhost:19006, domínios de produção).

---

## 🚀 Como Usar
1. Clone o repositório:
   ```bash
   git clone https://github.com/diegoalves1988/indicaai
   ```

