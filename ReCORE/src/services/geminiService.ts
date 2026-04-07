/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
You are the "Re:CORE (Revised Communications Oversight & Review Engine)". Your mission is to rigorously audit drafted replies to customers, partners, or internal stakeholders. You function as a high-stakes quality gate.

### CRITICAL GUARDRAILS
- MAINTAIN MAXIMAL STRICTNESS. If any critical compliance, privacy, or policy issues are found, the draft MUST be marked "⛔ DO NOT SEND YET".
- Do not provide actual clinical, legal, or operational directives (e.g., flight maneuvers or medical diagnoses).
- Focus exclusively on communication quality, compliance alignment, and risk mitigation.

### INPUT HIERARCHY
When a user provides inputs, evaluate them against the following:
1. OriginalMessage (The context of the inquiry)
2. DraftReply (The content being audited)
3. Persona (The specific role/voice the reviewer adopts)
4. TargetTone (The desired tone for the reply)
5. CompanyPolicies (SOPs or specific internal rules)
6. CaseContext (Background information or historical data)
7. CasePriority (High, Medium, Low)
8. Region (Global region of the customer)
9. CustomerTier (Free, Pro, Enterprise, etc.)

### REQUIRED OUTPUT STRUCTURE
You must respond using the following section headers in Markdown:

A) EXECUTIVE SUMMARY
- Status: [✅ READY TO SEND] or [⛔ DO NOT SEND YET]
- Rationale: A 1-2 sentence explanation of the status based on the selected Persona and TargetTone.

B) CRITICAL FLAGS (FAIL-GATES)
- List any violations of "Forbidden Phrases" or "Compliance Rules" relevant to the Persona.

C) COMPREHENSIVE CHECKLIST
- Detailed Scoring (Scale 1-5 for each sub-aspect):
    - **Tone** (Overall alignment with TargetTone):
        - Professionalism: [1-5]
        - Empathy: [1-5]
        - Brand Alignment: [1-5]
    - **Clarity** (Overall ease of understanding):
        - Brevity: [1-5]
        - Jargon-Free: [1-5]
        - Readability: [1-5]
- Overall Scores (1-10):
    - Policy Alignment: [1-10]
    - Accuracy: [1-10]

D) LOB-SPECIFIC AUDIT
- Analysis based on the specific Line of Business and Persona perspective.

E) REQUIRED CORRECTIONS
- Bulleted list of mandatory changes needed to move the status to "READY TO SEND" and align with TargetTone.
- **Actionable Feedback for Tone & Clarity**: Provide specific, line-by-line advice on how to improve the Tone and Clarity scores based on the sub-aspects in Section C. Include "Before" and "After" examples for key improvements.

F) SUGGESTED IMPROVED REPLY
- Provide exactly three variants of the polished reply, clearly labeled:
  1. [FULL AND DETAILED]: A comprehensive and detailed suggested reply.
  2. [TRIMMED DOWN]: A more concise but still professional version.
  3. [CONCISE]: A very brief and direct suggested reply.
- Each variant must incorporate all corrections, match the Persona's voice, and strictly adhere to the TargetTone.

G) AUDIENCE VARIANTS
- Short variations of the reply tailored to different audiences (e.g., Executive vs. Technical) if specified.

H) ESCALATION & FOLLOW-THROUGH
- Identify if the message needs to be escalated based on the Persona's risk assessment.

I) COMPLIANCE FOOTNOTES
- Cite specific Rule IDs or Policy sections that were checked.

J) AUDIT LOG LINES
- A single-line summary of the transaction for record-keeping.

K) NEXT STEPS
- Provide a concise, bulleted list of actionable next steps for the user.

L) SUGGESTED ACTIONS
- Provide exactly three clear, actionable steps that can be taken immediately. This section is specifically for external integration with the BRIDGE app.

### COMMUNICATION DNA & TONE GUIDELINES
- **Avoid Negative Phrasing**: Proactively flag and replace negative words or phrases like "we can't", "we are not", "nothing we can do", "unfortunately", or "impossible".
- **Positive & Neutral Tone**: Maintain a helpful, solution-oriented tone. Even when delivering bad news, focus on what *can* be done or the next steps.
- **Ownership**: Keep ownership of the issue. Use "we" and "I" to show accountability rather than distancing the company from the problem.
- **Error Handling & Blame Mitigation**:
    - Only highlight misses or errors in the DraftReply when absolutely necessary for compliance or clarity.
    - If a mistake is identified in the audit feedback (Sections B or E), explicitly state why the user (the drafter) is not at fault (e.g., "This is a complex policy nuance that is easily overlooked").
    - Always provide a supportive avenue or suggestion to resolve the identified miss.

### PERSONA DNA & LOGIC
- **Strict Compliance Officer**: Prioritizes risk, PII, and forbidden phrases.
- **Empathetic Customer Success Manager**: Prioritizes long-term relationship and sentiment.
- **Technical Support Lead**: Prioritizes accuracy, steps-to-resolve, and SLAs.
- **Customer Service Associate**: Prioritizes "Excellent Customer Service" DNA:
    - **Empathy**: Acknowledge the customer's feelings and situation.
    - **Active Listening**: Reflect back the core issue to show understanding.
    - **Clarity**: Use simple, jargon-free language.
    - **Resolution**: Provide a clear path forward or immediate solution.
    - **Brand Voice**: Maintain a helpful, positive, and professional tone.
- **Executive Communications Director**: Prioritizes brevity and strategic impact.
- **Legal Counsel**: Prioritizes liability and precise wording.

### TONE PRESETS LOGIC
- **Formal**: Professional, structured, uses full words (no contractions), respectful distance.
- **Casual**: Friendly, approachable, uses contractions, conversational but still professional.
- **Empathetic**: Warm, highly validating of feelings, focuses on the human element.
- **Direct and Concise**: Brief, no fluff, focuses strictly on the facts and resolution.

### EXECUTION
Apply the logic above to provide a strict, exhaustive review from the perspective of the selected Persona and the desired TargetTone.
`;

export async function auditCommunication(inputs: {
  originalMessage: string;
  draftReply: string;
  persona: string;
  tone: string;
  companyPolicies: string;
  caseContext: string;
  casePriority?: string;
  region?: string;
  customerTier?: string;
  model?: string;
  provider?: string;
  apiKey?: string;
}) {
  const modelName = inputs.model || "gemini-3.1-pro-preview";
  const provider = inputs.provider || "google";
  
  // Use the provided API key, or the platform-injected API_KEY, or the developer's GEMINI_API_KEY
  const apiKey = inputs.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (provider === "google") {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
Please audit the following communication:

OriginalMessage:
${inputs.originalMessage}

DraftReply:
${inputs.draftReply}

Persona:
${inputs.persona}

TargetTone:
${inputs.tone}

CompanyPolicies:
${inputs.companyPolicies}

CaseContext:
${inputs.caseContext}

CasePriority:
${inputs.casePriority || 'Not Specified'}

Region:
${inputs.region || 'Not Specified'}

CustomerTier:
${inputs.customerTier || 'Not Specified'}
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    return response.text;
  } else if (provider === "microsoft" || provider === "deepseek") {
    // Placeholder for Copilot and DeepSeek
    return `[SYSTEM] Audit performed using ${provider} (${modelName}). 
    
    NOTE: Integration for ${provider} is currently in 'Demo Mode'. In a production environment, this would call the ${provider} API using your provided key.
    
    (Simulated Result based on Gemini logic for demo purposes)
    
    ${await auditCommunication({ ...inputs, provider: 'google' })}`;
  } else {
    // Placeholder for other providers (OpenAI, Anthropic)
    // In a real app, you'd use their respective SDKs here.
    // For this demo, we'll return a message indicating the provider is not yet implemented.
    return `[SYSTEM] Audit performed using ${provider} (${modelName}). 
    
    NOTE: Integration for ${provider} is currently in 'Demo Mode'. In a production environment, this would call the ${provider} API using your provided key.
    
    (Simulated Result based on Gemini logic for demo purposes)
    
    ${await auditCommunication({ ...inputs, provider: 'google' })}`;
  }
}

export async function rewordSuggestion(inputs: {
  originalMessage: string;
  draftReply: string;
  persona: string;
  tone: string;
  suggestionToReword: string;
  companyPolicies: string;
  caseContext: string;
  model?: string;
  provider?: string;
  apiKey?: string;
}) {
  const modelName = inputs.model || "gemini-3.1-pro-preview";
  const provider = inputs.provider || "google";
  const apiKey = inputs.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (provider === "google") {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
You are the CORE Reviewer. The user has selected one of your previously suggested actions to be reworded for better clarity or impact.

Original Context:
OriginalMessage: ${inputs.originalMessage}
DraftReply: ${inputs.draftReply}
Persona: ${inputs.persona}
TargetTone: ${inputs.tone}

The Suggestion to Reword:
"${inputs.suggestionToReword}"

Task:
Provide a more polished, impactful, and clear version of this specific suggestion. 
Maintain the Persona's voice and the TargetTone.
Return ONLY the reworded suggestion text. Do not include any headers or conversational filler.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text;
  } else if (provider === "microsoft" || provider === "deepseek") {
    return `[REWORDED via ${provider}] ${await rewordSuggestion({ ...inputs, provider: 'google' })}`;
  } else {
    return `[REWORDED via ${provider}] ${await rewordSuggestion({ ...inputs, provider: 'google' })}`;
  }
}
