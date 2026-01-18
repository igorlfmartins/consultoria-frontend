# Migração para Arquitetura Serverless (Vercel)

Este projeto foi migrado de uma arquitetura baseada em Make.com para uma API Serverless robusta hospedada na Vercel.

## 🚀 Vantagens
- **Propriedade Intelectual:** A lógica da IA ("Strategic Board Advisor") agora reside em `api/consultoria.ts`, sob seu controle.
- **Segurança:** O frontend exige uma `x-api-key` para se comunicar com o backend.
- **Custo:** Utiliza a infraestrutura da Vercel (tier gratuito generoso) e Google Gemini.

## 🛠 Como Rodar Localmente

Para testar o Frontend E o Backend juntos, você precisa do `Vercel CLI`.

1. **Instale o Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Configure as Variáveis:**
   Edite o arquivo `.env` e coloque sua `GEMINI_API_KEY`.

3. **Inicie o Servidor:**
   Na raiz do projeto, rode:
   ```bash
   vercel dev
   ```
   Isso iniciará tanto o site (Frontend) quanto a API (Backend) em `http://localhost:3000`.

## 📦 Como Entregar para o Cliente

1. **Deploy do Backend (Sua Conta):**
   - Faça push deste repositório para o GitHub.
   - Conecte o repositório na sua conta da Vercel.
   - Nas configurações do projeto na Vercel, adicione as variáveis de ambiente (`GEMINI_API_KEY` e `CLIENT_API_KEY`).

2. **Entrega do Frontend (Cliente):**
   - Você pode enviar a pasta `src` e `public` para o cliente.
   - O cliente deve configurar o `.env` dele (ou as variáveis de deploy dele) com:
     - `VITE_API_URL`: A URL do SEU projeto na Vercel (ex: `https://seu-projeto.vercel.app/api/consultoria`)
     - `VITE_CLIENT_API_KEY`: A chave que você definiu.

## 📁 Estrutura
- `_Backup_V01/`: Backup do projeto antigo (Make.com).
- `api/`: Backend Serverless (Lógica da IA).
- `src/`: Frontend React.
