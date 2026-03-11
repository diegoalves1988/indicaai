# 🚀 Publicando o App na Google Play Store

Este guia descreve o passo a passo para publicar o **indicaai** na Google Play Store utilizando o [EAS (Expo Application Services)](https://expo.dev/eas).

---

## Pré-requisitos

- Conta no [Expo](https://expo.dev) (logado via `eas login`)
- Conta de desenvolvedor na [Google Play Console](https://play.google.com/console) (taxa única de US$ 25)
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
3. Preencha nome, idioma padrão, tipo (app/jogo) e se é pago/gratuito
4. Aceite as políticas do desenvolvedor

---

## Passo 4 – Preencher as Informações do App

Na seção **Presença na Play Store**, preencha:

- **Descrição curta** (máx. 80 caracteres)
- **Descrição completa** (máx. 4000 caracteres)
- **Ícone** (512×512 px, PNG)
- **Imagens de destaque** (1024×500 px)
- **Capturas de tela** (mínimo 2, para cada tipo de dispositivo)
- **Classificação etária**: preencha o questionário de classificação de conteúdo
- **Política de privacidade**: URL obrigatória se o app coleta dados de usuários

---

## Passo 5 – Criar uma Release e Enviar o AAB

1. No Play Console, vá em **Produção → Criar nova versão**
2. Faça upload do arquivo `.aab` gerado no Passo 2
3. Preencha as **notas de versão** (o que há de novo)
4. Clique em **Revisar versão**

> **Alternativa via EAS Submit**: após o build, você também pode enviar diretamente pelo EAS:
> ```bash
> eas submit --platform android --profile production
> ```
> Você precisará fornecer uma chave de API do Google Play. Veja como gerar em [Expo EAS Submit – Android](https://docs.expo.dev/submit/android/).

---

## Passo 6 – Revisão e Publicação

1. Revise todos os itens indicados pelo Play Console (ícone, capturas de tela, classificação, etc.)
2. Clique em **Iniciar lançamento para produção**
3. O Google irá revisar o app (geralmente entre algumas horas e 3 dias úteis)
4. Após aprovação, o app estará disponível na Play Store

---

## Atualizações Futuras

Para publicar novas versões do app:

1. O `versionCode` é incrementado automaticamente pelo EAS (`"autoIncrement": true` no `eas.json`)
2. Repita os Passos 2, 5 e 6 para cada nova versão
3. Para updates sem novo build nativo (apenas JS), utilize o **EAS Update**:
   ```bash
   eas update --channel production --message "Descrição da atualização"
   ```

---

## Referências

- [Expo EAS Build – Android](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit – Android](https://docs.expo.dev/submit/android/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
