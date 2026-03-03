/**
 * Cloudflare Worker — Formulaire contact IA CashFlow
 * task-007
 *
 * Recoit les soumissions du formulaire contact, valide les donnees,
 * envoie un email de confirmation au prospect via Brevo API v3,
 * et notifie nks.avenir@gmail.com.
 *
 * Variables d'environnement requises (Cloudflare Worker Secrets) :
 *   BREVO_API_KEY   — Cle API Brevo v3
 *   ALLOWED_ORIGIN  — Origine autorisee (ex: https://iacashflow.pro)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const NOTIFICATION_EMAIL = 'nks.avenir@gmail.com';
const SENDER_EMAIL = 'kkamagra18@gmail.com';
const SENDER_NAME = 'IA CashFlow';

/**
 * Labels lisibles pour les valeurs du formulaire
 */
const PROJECT_TYPE_LABELS = {
  'app-mobile': 'App Mobile',
  'systeme-ia': 'Systeme IA',
  'backend-api': 'Backend / API',
  'automatisation': 'Automatisation',
  'autre': 'Autre'
};

const BUDGET_LABELS = {
  'moins-5k': '< 5 000 €',
  '5k-10k': '5 000 - 10 000 €',
  '10k-25k': '10 000 - 25 000 €',
  '25k-plus': '25 000 € +',
  'a-definir': 'A definir',
  '': 'Non specifie'
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(env);
    }

    // Seul POST est accepte
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Methode non autorisee' }, 405, env);
    }

    try {
      const data = await request.json();

      // Validation serveur
      const errors = validateData(data);
      if (errors.length > 0) {
        return jsonResponse({ error: 'Donnees invalides', details: errors }, 400, env);
      }

      // Sanitize les donnees
      const clean = sanitize(data);

      // Envoi des emails via Brevo API v3
      await Promise.all([
        sendConfirmationEmail(clean, env),
        sendNotificationEmail(clean, env)
      ]);

      return jsonResponse({ success: true, message: 'Demande envoyee avec succes.' }, 200, env);

    } catch (err) {
      console.error('Erreur Worker:', err);
      return jsonResponse(
        { error: 'Erreur interne. Veuillez reessayer.' },
        500,
        env
      );
    }
  }
};

/**
 * Validation des donnees cote serveur
 */
function validateData(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Le nom est requis (min. 2 caracteres).');
  }
  if (!data.name || data.name.trim().length > 100) {
    errors.push('Le nom ne doit pas depasser 100 caracteres.');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push("L'email est requis.");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push("L'adresse email n'est pas valide.");
    }
  }

  const validTypes = ['app-mobile', 'systeme-ia', 'backend-api', 'automatisation', 'autre'];
  if (!data.project_type || !validTypes.includes(data.project_type)) {
    errors.push('Type de projet invalide.');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
    errors.push('La description est requise (min. 10 caracteres).');
  }
  if (data.description && data.description.length > 2000) {
    errors.push('La description ne doit pas depasser 2000 caracteres.');
  }

  return errors;
}

/**
 * Sanitize les donnees utilisateur
 */
function sanitize(data) {
  return {
    name: escapeHtml(data.name.trim()),
    email: data.email.trim().toLowerCase(),
    project_type: data.project_type,
    budget: data.budget || '',
    description: escapeHtml(data.description.trim())
  };
}

/**
 * Echappe les caracteres HTML pour eviter les injections
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Envoie l'email de confirmation au prospect
 */
async function sendConfirmationEmail(data, env) {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0D1A; color: #E0E0E0; padding: 40px 30px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Space Grotesk', sans-serif; color: #00D4AA; font-size: 24px; margin: 0;">IA CashFlow</h1>
      </div>
      <h2 style="color: #ffffff; font-size: 20px;">Merci ${data.name} !</h2>
      <p>Nous avons bien recu votre demande de devis. Notre equipe l'analyse et vous recevrez une reponse sous <strong style="color: #00D4AA;">24 heures</strong>.</p>
      <div style="background: rgba(26, 26, 46, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #00D4AA; margin-top: 0; font-size: 16px;">Recapitulatif</h3>
        <p><strong>Projet :</strong> ${PROJECT_TYPE_LABELS[data.project_type] || data.project_type}</p>
        <p><strong>Budget :</strong> ${BUDGET_LABELS[data.budget] || 'Non specifie'}</p>
        <p><strong>Description :</strong><br>${data.description.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="color: #8A8AA0; font-size: 14px;">Si vous avez des questions, repondez directement a cet email.</p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
      <p style="color: #8A8AA0; font-size: 12px; text-align: center;">IA CashFlow — iacashflow.pro</p>
    </div>
  `;

  return callBrevoAPI(env, {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: data.email, name: data.name }],
    subject: 'Votre demande de devis — IA CashFlow',
    htmlContent: html
  });
}

/**
 * Envoie la notification interne
 */
async function sendNotificationEmail(data, env) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #00D4AA;">Nouveau lead — iacashflow.pro</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Nom</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.name}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${PROJECT_TYPE_LABELS[data.project_type] || data.project_type}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Budget</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${BUDGET_LABELS[data.budget] || 'Non specifie'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; vertical-align: top;">Description</td><td style="padding: 8px;">${data.description.replace(/\n/g, '<br>')}</td></tr>
      </table>
      <p style="margin-top: 20px; color: #888; font-size: 12px;">Recu le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
    </div>
  `;

  return callBrevoAPI(env, {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: NOTIFICATION_EMAIL, name: 'IA CashFlow' }],
    replyTo: { email: data.email, name: data.name },
    subject: `[Lead] ${data.name} — ${PROJECT_TYPE_LABELS[data.project_type] || data.project_type}`,
    htmlContent: html
  });
}

/**
 * Appel generique a l'API Brevo v3
 */
async function callBrevoAPI(env, payload) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Brevo API error:', response.status, body);
    throw new Error(`Brevo API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Reponse JSON avec CORS
 */
function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

/**
 * Gestion CORS preflight
 */
function handleCORS(env) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
