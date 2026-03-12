# 🚀 Publicando o App na Google Play Store

Este guia descreve o passo a passo para publicar o **indicaai** na Google Play Store utilizando o [EAS (Expo Application Services)](https://expo.dev/eas).

---

## Pré-requisitos

- [x] Conta no [Expo](https://expo.dev) (logado via `eas login`)
- [x] Conta de desenvolvedor na [Google Play Console](https://play.google.com/console) ✅
- Node.js e EAS CLI instalados:
  ```bash
  npm install -g eas-cli
  ```

---

## Passo 1 – Configurar o EAS Build

Certifique-se de que o arquivo `eas.json` já está configurado (já está no projeto). O perfil `production` é o utilizado para publicação:

```json
"production": {
  "autoIncrement": true,
  "channel": "production"
}
```

---

## Passo 2 – Gerar o Build de Produção (AAB)

Execute o comando abaixo para gerar o bundle AAB (Android App Bundle) necessário para a Play Store:

```bash
eas build --platform android --profile production
```

O EAS irá:
1. Solicitar ou gerar automaticamente um **Keystore** de assinatura (guarde-o em local seguro)
2. Compilar o app na nuvem
3. Disponibilizar o arquivo `.aab` para download ao final do build

---

## Passo 3 – Criar o App na Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Clique em **Criar app**
3. Preencha:
   - **Nome do app**: `indicaai`
   - **Idioma padrão**: Português (Brasil)
   - **Tipo**: App
   - **Gratuito ou pago**: Gratuito
4. Aceite as políticas do desenvolvedor e clique em **Criar app**

---

## Passo 4 – Criar a Chave de Conta de Serviço da API do Google Play

O EAS Submit precisa de uma chave de serviço para enviar o AAB automaticamente. Siga os passos abaixo:

### 4.1 – Vincular um projeto do Google Cloud

1. No Play Console, vá em **Configurações → Acesso à API**
2. Clique em **Vincular a um projeto do Google Cloud**
3. Crie um novo projeto ou vincule um existente

### 4.2 – Criar a conta de serviço

1. Na mesma tela, clique em **Criar nova conta de serviço**
2. Siga o link para o **Google Cloud Console** que aparece na janela
3. Clique em **+ Criar conta de serviço**
4. Preencha o nome (ex: `eas-submit`) e clique em **Criar e continuar**
5. Atribua o papel **Editor** e clique em **Continuar → Concluir**

### 4.3 – Gerar a chave JSON

1. Na lista de contas de serviço, clique nos três pontos (⋮) da conta criada → **Gerenciar chaves**
2. Clique em **Adicionar chave → Criar nova chave → JSON → Criar**
3. O arquivo JSON será baixado automaticamente
4. **Renomeie o arquivo para `google-play-service-account.json`** e coloque na raiz do projeto (mesmo diretório que o `eas.json`)
5. Esse arquivo já está no `.gitignore` — **nunca o commite no repositório**

### 4.4 – Conceder permissão no Play Console

1. Volte ao Play Console → **Configurações → Acesso à API**
2. Na lista de contas de serviço, clique em **Conceder acesso** ao lado da conta criada
3. Atribua no mínimo as permissões:
   - **Gerenciar versões de produção**
   - **Gerenciar faixas de teste**
4. Clique em **Convidar usuário → Aplicar**

---

## Passo 5 – Preencher as Informações do App

Na seção **Presença na Play Store**, preencha:

- **Descrição curta** (máx. 80 caracteres)
- **Descrição completa** (máx. 4000 caracteres)
- **Ícone** (512×512 px, PNG)
- **Imagens de destaque** (1024×500 px)
- **Capturas de tela** (mínimo 2, para cada tipo de dispositivo)
- **Classificação etária**: preencha o questionário de classificação de conteúdo
- **Política de privacidade**: URL obrigatória se o app coleta dados de usuários

---

## Passo 6 – Criar uma Release e Enviar o AAB

1. No Play Console, vá em **Produção → Criar nova versão**
2. Faça upload do arquivo `.aab` gerado no Passo 2
3. Preencha as **notas de versão** (o que há de novo)
4. Clique em **Revisar versão**

> **Recomendado – envio via EAS Submit**: com a chave de serviço configurada (Passo 4) e o `eas.json` já atualizado, basta rodar:
> ```bash
> eas submit --platform android --profile production
> ```
> O EAS irá usar o `google-play-service-account.json` e enviar o último build de produção automaticamente para a faixa `production` da Play Store.

---

## Passo 7 – Revisão e Publicação

1. Revise todos os itens indicados pelo Play Console (ícone, capturas de tela, classificação, etc.)
2. Clique em **Iniciar lançamento para produção**
3. O Google irá revisar o app (geralmente entre algumas horas e 3 dias úteis)
4. Após aprovação, o app estará disponível na Play Store

---

## Atualizações Futuras

Para publicar novas versões do app:

1. O `versionCode` é incrementado automaticamente pelo EAS (`"autoIncrement": true` no `eas.json`)
2. Repita os Passos 2 e 6 para cada nova versão
3. Para updates sem novo build nativo (apenas JS), utilize o **EAS Update**:
   ```bash
   eas update --channel production --message "Descrição da atualização"
   ```

---

## Referências

- [Expo EAS Build – Android](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit – Android](https://docs.expo.dev/submit/android/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
