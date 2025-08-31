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

## 🚀 Como Usar
1. Clone o repositório:
   ```bash
   git clone https://github.com/diegoalves1988/indicaai
   ```

## 🔑 Configuração do Login com Google

1. No [Google Cloud Console](https://console.cloud.google.com), em **OAuth consent screen** adicione o domínio do app em **Authorized domains**.
2. Em **Credentials**, edite o **OAuth 2.0 Client ID** e inclua nas **Authorized redirect URIs** o valor sugerido pelo Expo (por exemplo `https://auth.expo.io/@diegocruzalves/indicaai`) ou o esquema definido no `app.json` (`indicaai://auth`).
3. Copie o **Client ID** do tipo Web e defina-o em `app.json` dentro de `expo.extra.EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
4. Após salvar as alterações, limpe cookies/sessão do app e tente novamente o login.


