// Progressive enhancement for the Quote and Contact forms.
// The same validation module runs here and on the server; the server decides.
import { validateContact, validateQuote, validateStep1, parisNow, type FieldErrors } from '../lib/validation';

interface Config {
  lang: 'fr' | 'en';
  kind: 'devis' | 'contact';
  serviceIds?: string[];
  serviceTitles?: Record<string, string>;
  maxPassengers?: number;
  errors: Record<string, string>;
  status: Record<string, string>;
  labels?: Record<string, string>;
}

type ApiResponse = { ok: boolean; status: string; message?: string; errors?: FieldErrors; requestId?: string };

const STEP1 = ['departure', 'arrival', 'date', 'time', 'passengers', 'service'];

function formData(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === 'string') out[k] = v;
  });
  return out;
}

function newRequestId() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function enhance(form: HTMLFormElement) {
  const cfg = JSON.parse(form.dataset.config || '{}') as Config;
  const $ = <T extends Element>(sel: string) => form.querySelector<T>(sel);
  const submitBtn = $<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = submitBtn.textContent ?? '';
  const errorBox = $<HTMLElement>('[data-error-box]')!;
  const errorText = $<HTMLElement>('[data-error-text]')!;
  const doneBox = $<HTMLElement>('[data-done-box]')!;
  const ridInput = $<HTMLInputElement>('input[name="requestId"]')!;
  let submitting = false;

  form.noValidate = true; // our messages replace the browser bubbles
  form.classList.add('is-enhanced');
  ridInput.value = newRequestId(); // one id per filled form, reused on retries

  // ----- field errors -------------------------------------------------------
  const fieldEl = (name: string) => form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;
  function showErrors(errors: FieldErrors, scope?: string[]) {
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((p) => {
      const name = p.dataset.errorFor!;
      if (scope && !scope.includes(name)) return;
      const code = errors[name];
      p.textContent = code ? cfg.errors[code] ?? cfg.errors.invalid : '';
      const el = fieldEl(name);
      if (el instanceof HTMLElement) el.setAttribute('aria-invalid', code ? 'true' : 'false');
    });
  }
  function focusFirst(errors: FieldErrors, order: string[]) {
    const first = order.find((n) => errors[n]);
    if (!first) return;
    const el = fieldEl(first);
    const target = el instanceof RadioNodeList ? (el[0] as HTMLElement) : el;
    target?.focus();
  }
  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.getAttribute('aria-invalid') === 'true') {
      el.setAttribute('aria-invalid', 'false');
      const p = form.querySelector(`[data-error-for="${el.name}"]`);
      if (p) p.textContent = '';
    }
  });

  // ----- quote: steps, recap, preselection ---------------------------------
  const ctx = () => ({ now: new Date(), serviceIds: cfg.serviceIds ?? [], maxPassengers: cfg.maxPassengers ?? 20 });
  if (cfg.kind === 'devis') {
    const progress = $<HTMLElement>('[data-progress]')!;
    const progressText = $<HTMLElement>('[data-progress-text]')!;
    const progressBar = $<HTMLElement>('[data-progress-bar]')!;
    const recap = $<HTMLElement>('[data-recap]')!;
    const recapBody = $<HTMLElement>('[data-recap-body]')!;
    const stepTpl = progressText.textContent ?? '';
    progress.hidden = false;
    recap.hidden = false;
    $<HTMLElement>('[data-step-nav]')!.hidden = false;

    const dateInput = $<HTMLInputElement>('input[name="date"]')!;
    dateInput.min = parisNow().date;

    // ?prestation=<id> carries ONLY the journey type chosen on the home page.
    const pre = new URLSearchParams(location.search).get('prestation');
    const select = $<HTMLSelectElement>('select[name="service"]')!;
    if (pre && cfg.serviceIds?.includes(pre)) {
      select.value = pre;
      const note = $<HTMLElement>('[data-preselected]')!;
      note.textContent = `${cfg.labels?.preselected} ${cfg.serviceTitles?.[pre]}`;
      note.hidden = false;
    }
    const extras = $<HTMLDetailsElement>('[data-extras]');
    const openExtrasIfUseful = () => {
      if (extras && select.value === 'transfert') extras.open = true;
    };
    select.addEventListener('change', openExtrasIfUseful);
    openExtrasIfUseful();

    const go = (step: 1 | 2, focus = true) => {
      form.dataset.current = String(step);
      progressText.textContent = stepTpl.replace(/\d/, String(step));
      progressBar.style.width = step === 1 ? '50%' : '100%';
      if (focus) {
        const legend = form.querySelector<HTMLElement>(`[data-step="${step}"] legend`);
        legend?.setAttribute('tabindex', '-1');
        legend?.focus({ preventScroll: true });
        form.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    };
    go(1, false);

    $<HTMLButtonElement>('[data-next]')!.addEventListener('click', () => {
      const data = formData(form);
      const errors = validateStep1(data, ctx());
      showErrors(errors, STEP1);
      if (Object.keys(errors).length) return focusFirst(errors, STEP1);
      const title = data.service ? cfg.serviceTitles?.[data.service] : '';
      const dt = new Intl.DateTimeFormat(cfg.lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${data.date}T00:00:00Z`));
      recapBody.textContent = [`${data.departure} → ${data.arrival}`, `${dt}, ${data.time} (Europe/Paris)`, `${data.passengers} ${data.passengers === '1' ? cfg.labels?.recapPassenger : cfg.labels?.recapPassengers}`, title].filter(Boolean).join(' · ');
      go(2);
    });
    $<HTMLButtonElement>('[data-back]')!.addEventListener('click', () => go(1));
  }

  // ----- submission ------------------------------------------------------------
  const setBusy = (busy: boolean) => {
    submitting = busy;
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    submitBtn.textContent = busy ? cfg.labels?.sending ?? '…' : submitLabel;
  };
  const showError = (message: string) => {
    errorText.textContent = message;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ block: 'center', behavior: 'auto' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return; // double click / double tap
    errorBox.hidden = true;
    const data = formData(form);
    const result = cfg.kind === 'devis' ? validateQuote(data, ctx()) : validateContact(data);
    if (!result.ok) {
      showErrors(result.errors);
      if (cfg.kind === 'devis' && STEP1.some((n) => result.errors[n])) {
        form.dataset.current = '1';
        form.querySelector<HTMLButtonElement>('[data-back]')?.click();
      }
      return focusFirst(result.errors, [...STEP1, 'name', 'contactMethod', 'email', 'phone', 'message', 'luggage', 'travelRef', 'returnTrip', 'details']);
    }
    showErrors({});
    setBusy(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      const body = (await res.json().catch(() => ({ ok: false, status: 'failed' }))) as ApiResponse;
      if (res.ok && body.ok) return done(body);
      if (body.status === 'invalid' && body.errors) {
        showErrors(body.errors);
        showError(cfg.status.invalid);
        if (cfg.kind === 'devis' && STEP1.some((n) => body.errors![n])) form.querySelector<HTMLButtonElement>('[data-back]')?.click();
        return;
      }
      const map: Record<string, string> = {
        'rate-limited': cfg.status.rateLimited,
        'not-configured': cfg.status.notConfigured,
        'in-progress': cfg.status.inProgress,
      };
      showError(map[body.status] ?? cfg.status.failed);
    } catch {
      showError(cfg.status.network);
    } finally {
      clearTimeout(timer);
      if (!form.classList.contains('is-done')) setBusy(false);
    }
  });

  function done(body: ApiResponse) {
    form.classList.add('is-done');
    const notice = $<HTMLElement>('[data-done-notice]')!;
    const simulated = body.status === 'simulated';
    notice.classList.add(simulated ? 'notice--test' : 'notice--ok');
    $<HTMLElement>('[data-done-text]')!.textContent = simulated ? cfg.status.simulated : cfg.kind === 'devis' ? cfg.status.quoteSent : cfg.status.contactSent;
    $<HTMLElement>('[data-done-extra]')!.textContent = cfg.kind === 'devis' ? cfg.status.notConfirmed : '';
    doneBox.hidden = false;
    doneBox.focus();
    doneBox.scrollIntoView({ block: 'center', behavior: 'auto' });
  }
}

export function enhanceForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((f) => {
    if (!f.classList.contains('is-enhanced')) enhance(f);
  });
}
