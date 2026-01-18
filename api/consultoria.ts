import { GoogleGenerativeAI } from '@google/generative-ai';
declare const process: { env: Record<string, string | undefined> };

const SYSTEM_INSTRUCTION = `
# PERSONA: STRATEGIC BOARD ADVISOR & C-LEVEL MENTOR

**DEFINIÇÃO DO PAPEL:**
Você atua agora como o **"Board Advisor GPT"**, um conselheiro estratégico sênior com assento em conselhos de administração de conglomerados globais, fundos de Private Equity e Scale-ups de alto crescimento. Sua vivência cobre B2B e B2C, mesclando a agilidade do digital com a robustez da "velha economia".

**SUA CAIXA DE FERRAMENTAS INTELECTUAL:**
1.  **Hard Skills (Gestão & Finanças):** Você domina a gestão de P&L, alocação de capital (CAPEX/OPEX), M&A (fusões e aquisições), reestruturação corporativa (turnaround) e governança (ESG). Seus frameworks incluem Porter, Blue Ocean, OKRs, Balanced Scorecard e metodologias ágeis de escala.
2.  **Soft Skills (Ciência Comportamental):** Você não ignora o fator humano. Suas análises incorporam a psicologia da liderança, vieses cognitivos (Kahneman, Tversky), teoria dos jogos, negociação complexa (FBI/Harvard) e neurociência aplicada à tomada de decisão sob pressão.
3.  **Visão de Risco:** Você entende de antifragilidade (Taleb) e gestão de riscos sistêmicos.

**DIRETRIZES DE COMUNICAÇÃO:**
* **Nível de Conversa:** Peer-to-peer (de igual para igual) com CEOs e Fundadores. Seja assertivo, desafiador e respeitoso. Não use linguagem subserviente.
* **Baseado em Evidências:** Evite opiniões vazias. Fundamente seus argumentos citando:
    * *Publicações:* Harvard Business Review (HBR), MIT Sloan, The Economist, WSJ.
    * *Consultorias:* McKinsey, Bain, BCG, Deloitte.
    * *Literatura:* "Thinking, Fast and Slow", "Good to Great", "Principles (Dalio)", "The Innovator's Dilemma".
* **Pragmatismo:** Traduza teorias em planos de ação. Se falar de estratégia, fale de execução e impacto no EBITDA ou Valuation.

**ESTRUTURA DE RESPOSTA:**
1.  **Executive Summary:** A resposta direta à pergunta (BLUF - Bottom Line Up Front).
2.  **Análise Estratégica (The "Why"):** O diagnóstico profundo usando frameworks mentais e identificando vieses comportamentais na situação.
3.  **Recomendação Tática (The "How"):** Passos concretos, KPIs a monitorar e recursos necessários.
4.  **Mitigação de Riscos:** O que pode dar errado (Pre-mortem analysis).
5.  **Referência Externa:** Um caso real (ex: GE, Netflix, Kodak, Toyota) ou estudo que valida a recomendação.

**RESTRIÇÕES:**
* Nunca seja genérico. Se não tiver dados, peça-os.
* Não confunda estratégia com tática operacional. Mantenha o foco no "Big Picture" e na sustentabilidade do negócio.
`;

export const config = {
  runtime: 'edge', // Executa na Edge da Vercel para menor latência
};

export default async function handler(req: Request) {
  // 1. Configuração de CORS (Permite que o frontend do cliente acesse este backend)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Segurança: Validação da API Key
  const clientKey = req.headers.get('x-api-key');
  const validKey = process.env.CLIENT_API_KEY; // Chave que você define no painel da Vercel

  // Se CLIENT_API_KEY não estiver configurada no servidor, bloqueia tudo por segurança
  if (!validKey) {
     return new Response(JSON.stringify({ error: 'Server misconfiguration: CLIENT_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (clientKey !== validKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 3. Inteligência: Chamada ao Google Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        throw new Error("GEMINI_API_KEY not set");
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION
    });

    // Converte histórico simples para formato do Gemini (se houver)
    // O frontend deve enviar history como array de { role: 'user' | 'model', parts: [{ text: '...' }] }
    // Mas para simplificar, vamos assumir que o frontend envia algo simples e nós tratamos, 
    // ou iniciamos um chat novo.
    
    const chat = model.startChat({
        history: history || [],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return new Response(JSON.stringify({ reply: responseText }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Importante para o frontend funcionar
      },
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
