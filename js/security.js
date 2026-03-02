/**
 * security.js — Utilitaires de securite pour iacashflow.pro
 * Agent-8 (Drew) — Security Engineer
 *
 * Sanitization des inputs, prevention XSS, validation formulaire contact.
 * A inclure dans toutes les pages avec formulaires.
 */

'use strict';

const Security = (() => {

  /**
   * Echappe les caracteres HTML dangereux pour prevenir les injections XSS.
   * @param {string} str - Chaine a nettoyer
   * @returns {string} Chaine echappee
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#96;'
    };
    return str.replace(/[&<>"'\/`]/g, (char) => map[char]);
  }

  /**
   * Supprime les balises HTML/script d'une chaine.
   * @param {string} str - Chaine a nettoyer
   * @returns {string} Chaine sans balises
   */
  function stripTags(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '');
  }

  /**
   * Sanitize un input de formulaire : strip tags + escape HTML + trim.
   * @param {string} value - Valeur brute de l'input
   * @returns {string} Valeur nettoyee
   */
  function sanitizeInput(value) {
    if (typeof value !== 'string') return '';
    return escapeHTML(stripTags(value.trim()));
  }

  /**
   * Valide un email avec une regex stricte.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return re.test(email) && email.length <= 254;
  }

  /**
   * Valide un nom (pas de caracteres speciaux dangereux).
   * @param {string} name
   * @returns {boolean}
   */
  function isValidName(name) {
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 100) return false;
    // Autorise lettres (unicode), espaces, tirets, apostrophes
    const re = /^[\p{L}\s\-']+$/u;
    return re.test(trimmed);
  }

  /**
   * Valide la longueur d'un textarea.
   * @param {string} text
   * @param {number} maxLength
   * @returns {boolean}
   */
  function isValidTextarea(text, maxLength = 2000) {
    if (typeof text !== 'string') return false;
    return text.trim().length > 0 && text.trim().length <= maxLength;
  }

  /**
   * Sanitize toutes les donnees du formulaire de contact.
   * @param {Object} formData - { nom, email, type_projet, budget, description }
   * @returns {{ valid: boolean, errors: string[], data: Object }}
   */
  function validateContactForm(formData) {
    const errors = [];
    const data = {};

    // Nom
    const nom = sanitizeInput(formData.nom || '');
    if (!isValidName(formData.nom || '')) {
      errors.push('Nom invalide (2-100 caracteres, lettres uniquement)');
    }
    data.nom = nom;

    // Email
    const email = sanitizeInput(formData.email || '');
    if (!isValidEmail(formData.email || '')) {
      errors.push('Adresse email invalide');
    }
    data.email = email;

    // Type de projet (whitelist)
    const typesAutorises = ['App Mobile', 'Systeme IA', 'Backend/API', 'Automatisation', 'Autre'];
    const type = sanitizeInput(formData.type_projet || '');
    if (!typesAutorises.includes(formData.type_projet || '')) {
      errors.push('Type de projet invalide');
    }
    data.type_projet = type;

    // Budget (whitelist)
    const budgetsAutorises = ['< 5k', '5-10k', '10-25k', '25k+', 'A definir'];
    const budget = sanitizeInput(formData.budget || '');
    if (!budgetsAutorises.includes(formData.budget || '')) {
      errors.push('Budget invalide');
    }
    data.budget = budget;

    // Description
    const description = sanitizeInput(formData.description || '');
    if (!isValidTextarea(formData.description || '', 2000)) {
      errors.push('Description requise (max 2000 caracteres)');
    }
    data.description = description;

    return {
      valid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * Verifie et corrige les liens externes dans le DOM :
   * - Force HTTPS sur tous les liens externes
   * - Ajoute rel="noopener noreferrer" sur les target="_blank"
   */
  function auditExternalLinks() {
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Forcer HTTPS sur les liens http externes
      if (href.startsWith('http://') && !href.includes('localhost')) {
        link.setAttribute('href', href.replace('http://', 'https://'));
        console.warn(`[Security] Lien HTTP corrige en HTTPS : ${href}`);
      }

      // Ajouter rel="noopener noreferrer" sur target="_blank"
      if (link.getAttribute('target') === '_blank') {
        const rel = link.getAttribute('rel') || '';
        const parts = rel.split(/\s+/).filter(Boolean);
        if (!parts.includes('noopener')) parts.push('noopener');
        if (!parts.includes('noreferrer')) parts.push('noreferrer');
        link.setAttribute('rel', parts.join(' '));
      }
    });
  }

  // API publique
  return {
    escapeHTML,
    stripTags,
    sanitizeInput,
    isValidEmail,
    isValidName,
    isValidTextarea,
    validateContactForm,
    auditExternalLinks
  };

})();

// Audit automatique des liens au chargement de la page
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Security.auditExternalLinks();
  });
}
