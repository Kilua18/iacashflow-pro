/**
 * contact.js — Validation et soumission du formulaire contact
 * task-007 — IA CashFlow
 */

(function () {
  'use strict';

  // URL du Cloudflare Worker (a configurer en production)
  const WORKER_URL = 'https://contact-worker.kkamagra18.workers.dev';

  // Elements du DOM
  const form = document.getElementById('contact-form');
  const btnSubmit = document.getElementById('btn-submit');
  const formStatus = document.getElementById('form-status');
  const charCount = document.getElementById('char-count');
  const descriptionField = document.getElementById('contact-description');

  // Configuration des champs avec regles de validation
  const fields = {
    name: {
      el: document.getElementById('contact-name'),
      errorEl: document.getElementById('error-name'),
      validate(value) {
        if (!value.trim()) return 'Le nom est requis.';
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caracteres.';
        if (value.trim().length > 100) return 'Le nom ne doit pas depasser 100 caracteres.';
        return '';
      }
    },
    email: {
      el: document.getElementById('contact-email'),
      errorEl: document.getElementById('error-email'),
      validate(value) {
        if (!value.trim()) return "L'email est requis.";
        // Regex email simple mais robuste
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return "L'adresse email n'est pas valide.";
        return '';
      }
    },
    project_type: {
      el: document.getElementById('contact-project-type'),
      errorEl: document.getElementById('error-project-type'),
      validate(value) {
        if (!value) return 'Veuillez selectionner un type de projet.';
        return '';
      }
    },
    description: {
      el: document.getElementById('contact-description'),
      errorEl: document.getElementById('error-description'),
      validate(value) {
        if (!value.trim()) return 'La description est requise.';
        if (value.trim().length < 10) return 'La description doit contenir au moins 10 caracteres.';
        if (value.trim().length > 2000) return 'La description ne doit pas depasser 2000 caracteres.';
        return '';
      }
    }
  };

  /**
   * Affiche ou cache un message d'erreur pour un champ
   */
  function showFieldError(fieldKey, message) {
    const field = fields[fieldKey];
    if (!field) return;

    if (message) {
      field.errorEl.textContent = message;
      field.errorEl.classList.add('visible');
      field.el.classList.add('error');
      field.el.classList.remove('valid');
    } else {
      field.errorEl.textContent = '';
      field.errorEl.classList.remove('visible');
      field.el.classList.remove('error');
      field.el.classList.add('valid');
    }
  }

  /**
   * Valide un champ individuel
   */
  function validateField(fieldKey) {
    const field = fields[fieldKey];
    const value = field.el.value;
    const error = field.validate(value);
    showFieldError(fieldKey, error);
    return !error;
  }

  /**
   * Valide tous les champs du formulaire
   */
  function validateAll() {
    let isValid = true;
    for (const key of Object.keys(fields)) {
      if (!validateField(key)) {
        isValid = false;
      }
    }
    return isValid;
  }

  /**
   * Affiche le message de statut du formulaire
   */
  function showStatus(type, message) {
    formStatus.className = 'form-status ' + type;
    formStatus.textContent = message;
  }

  /**
   * Cache le message de statut
   */
  function hideStatus() {
    formStatus.className = 'form-status';
    formStatus.textContent = '';
  }

  /**
   * Active/desactive l'etat de chargement du bouton
   */
  function setLoading(loading) {
    if (loading) {
      btnSubmit.classList.add('loading');
      btnSubmit.disabled = true;
    } else {
      btnSubmit.classList.remove('loading');
      btnSubmit.disabled = false;
    }
  }

  /**
   * Collecte les donnees du formulaire
   */
  function getFormData() {
    return {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      project_type: fields.project_type.el.value,
      budget: document.getElementById('contact-budget').value || '',
      description: fields.description.el.value.trim()
    };
  }

  /**
   * Envoie les donnees au Cloudflare Worker
   */
  async function submitForm(data) {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || 'Erreur serveur. Veuillez reessayer.');
    }

    return response.json();
  }

  /**
   * Reset le formulaire apres envoi reussi
   */
  function resetForm() {
    form.reset();
    charCount.textContent = '0 / 2000';
    // Retirer les classes de validation
    for (const key of Object.keys(fields)) {
      fields[key].el.classList.remove('valid', 'error');
      fields[key].errorEl.classList.remove('visible');
      fields[key].errorEl.textContent = '';
    }
  }

  // --- Ecouteurs d'evenements ---

  // Validation en temps reel au blur
  for (const key of Object.keys(fields)) {
    fields[key].el.addEventListener('blur', function () {
      // Ne valider que si le champ a ete touche (a une valeur)
      if (this.value) {
        validateField(key);
      }
    });

    // Retirer l'erreur quand l'utilisateur commence a taper
    fields[key].el.addEventListener('input', function () {
      if (this.classList.contains('error')) {
        showFieldError(key, '');
      }
      hideStatus();
    });
  }

  // Compteur de caracteres pour la description
  descriptionField.addEventListener('input', function () {
    const len = this.value.length;
    charCount.textContent = len + ' / 2000';
  });

  // Soumission du formulaire
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideStatus();

    // Validation complete
    if (!validateAll()) {
      // Focus sur le premier champ en erreur
      const firstError = form.querySelector('.form-input.error, .form-select.error, .form-textarea.error');
      if (firstError) firstError.focus();
      return;
    }

    // Envoi
    setLoading(true);
    const data = getFormData();

    try {
      await submitForm(data);
      showStatus('success', 'Merci ! Votre demande a bien ete envoyee. Nous vous repondons sous 24h.');
      resetForm();
    } catch (err) {
      showStatus('error', err.message || 'Une erreur est survenue. Veuillez reessayer ou nous contacter directement.');
    } finally {
      setLoading(false);
    }
  });
})();
