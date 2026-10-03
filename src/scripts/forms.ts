// Progressive enhancement for the Quote and Contact forms.
// The same validation module runs here and on the server; the server decides.
// In demo mode the server always simulates and returns a summary; nothing is
// stored in the browser either (no localStorage/sessionStorage).
import { addDays, parisNow, validateContact, validateQuote, validateStep1, QUOTE_STEP1, type ContactMethod, type FieldErrors } from '../lib/validation';

interface ServiceMeta {
  id: string;
  title: string;
  hourly: { minHours: number } | null;
  travelRef: boolean;
}
interface Config {
  lang: 'fr' | 'en';
  kind: 'devis' | 'contact';
  demo?: boolean;
  services?: ServiceMeta[];
  routes?: { id: string; serviceId: string; from: string; to: string }[];
  maxPassengers?: number;
  channels?: ContactMethod[];
  example?: {
    name: string; contactMethod: ContactMethod; email: string; phone: string; serviceId: string; from: string; to: string;
    daysFromToday: number; time: string; passengers: number; luggage: string; luggageDetail: string; message: string;
  } | null;
  errors: Record<string, string>;
  fieldErrors?: Record<string, Record<string, string>>;
  status: Record<string, string>;
  labels?: Record<string, string>;
}

interface Summary {
  rows: { label: string; value: string }[];
  fare: { kind: 'reference' | 'custom'; lines: string[] };
}
type ApiResponse = { ok: boolean; status: string; message?: string; errors?: FieldErrors; requestId?: string; reference?: string; summary?: Summary };

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
  const $$ = <T extends Element>(sel: string) => Array.from(form.querySelectorAll<T>(sel));
  const submitBtn = $<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = submitBtn.textContent ?? '';
  const errorBox = $<HTMLElement>('[data-error-box]')!;
  const errorText = $<HTMLElement>('[data-error-text]')!;
  const doneBox = $<HTMLElement>('[data-done-box]')!;
  const ridInput = $<HTMLInputElement>('input[name="requestId"]')!;
  const channels = cfg.channels ?? ['email', 'phone'];
  let submitting = false;

  form.noValidate = true; // our messages replace the browser bubbles
  form.classList.add('is-enhanced');
  ridInput.value = newRequestId(); // one id per filled form, reused on retries

  // ----- field errors -------------------------------------------------------
  const message = (field: string, code: string) => cfg.fieldErrors?.[field]?.[code] ?? cfg.errors[code] ?? cfg.errors.invalid;
  const fieldEl = (name: string) => form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;
  function showErrors(errors: FieldErrors, scope?: readonly string[]) {
    $$<HTMLElement>('[data-error-for]').forEach((p) => {
      const name = p.dataset.errorFor!;
      if (scope && !scope.includes(name)) return;
      const code = errors[name];
      p.textContent = code ? message(name, code) : '';
      const el = fieldEl(name);
      if (el instanceof HTMLElement) el.setAttribute('aria-invalid', code ? 'true' : 'false');
    });
  }
  function focusFirst(errors: FieldErrors, order: readonly string[]) {
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

  // ----- conditional fields (hidden ones are disabled so they are not sent) --
  const setGroup = (selector: string, on: boolean) =>
    $$<HTMLElement>(selector).forEach((g) => {
      g.toggleAttribute('data-off', !on);
      g.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach((i) => (i.disabled = !on));
    });
  const radioValue = (name: string) => (form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '');
  function syncConditional() {
    const select = $<HTMLSelectElement>('select[name="service"]');
    const service = cfg.services?.find((s) => s.id === select?.value);
    const hourly = Boolean(service?.hourly);
    setGroup('[data-when="hourly"]', hourly);
    setGroup('[data-when-not="hourly"]', !hourly);
    setGroup('[data-when="return"]', !hourly && radioValue('tripType') === 'return');
    setGroup('[data-when="travelref"]', Boolean(service?.travelRef));
    const method = radioValue('contactMethod') as ContactMethod;
    setGroup('[data-when="email"]', method === 'email');
    setGroup('[data-when="phone"]', method === 'phone' || method === 'whatsapp');
    const phoneLabel = form.querySelector<HTMLLabelElement>('label[for="f-phone"]');
    if (phoneLabel && cfg.labels) phoneLabel.textContent = method === 'whatsapp' ? cfg.labels.whatsapp : cfg.labels.phone;
    const time = $<HTMLInputElement>('input[name="time"]');
    const tbd = $<HTMLInputElement>('[data-time-tbd]');
    if (time && tbd) time.disabled = tbd.checked;
    const hint = $<HTMLElement>('[data-passengers-hint]');
    const pax = $<HTMLSelectElement>('[name="passengers"]');
    if (hint && pax) hint.hidden = Number(pax.value) < (cfg.maxPassengers ?? 99);
  }
  form.addEventListener('change', syncConditional);
  syncConditional();

  // ----- quote: steps, recap, preselection, example ------------------------
  const ctx = () => ({ now: new Date(), services: (cfg.services ?? []).map((s) => ({ id: s.id, hourly: s.hourly ?? undefined })), maxPassengers: cfg.maxPassengers ?? 20, channels });
  let go: (step: 1 | 2, focus?: boolean) => void = () => {};
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

    const today = parisNow().date;
    $$<HTMLInputElement>('input[type="date"]').forEach((i) => (i.min = today));

    // ?prestation=<id> carries the journey type; ?trajet=<route id> (rates table) also the two places.
    const params = new URLSearchParams(location.search);
    const select = $<HTMLSelectElement>('select[name="service"]')!;
    const pre = params.get('prestation');
    const route = cfg.routes?.find((r) => r.id === params.get('trajet'));
    if (pre && cfg.services?.some((s) => s.id === pre)) {
      select.value = pre;
      const note = $<HTMLElement>('[data-preselected]')!;
      note.textContent = `${cfg.labels?.preselected} ${cfg.services.find((s) => s.id === pre)?.title}`;
      note.hidden = false;
      if (route && route.serviceId === pre) {
        $<HTMLInputElement>('input[name="departure"]')!.value = route.from;
        $<HTMLInputElement>('input[name="arrival"]')!.value = route.to;
      }
    }
    syncConditional();

    go = (step: 1 | 2, focus = true) => {
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

    const toStep2 = () => {
      const data = formData(form);
      const errors = validateStep1(data, ctx());
      showErrors(errors, QUOTE_STEP1);
      if (Object.keys(errors).length) return focusFirst(errors, QUOTE_STEP1);
      const service = cfg.services?.find((s) => s.id === data.service);
      const dt = new Intl.DateTimeFormat(cfg.lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${data.date}T00:00:00Z`));
      const pax = `${data.passengers} ${data.passengers === '1' ? cfg.labels?.recapPassenger : cfg.labels?.recapPassengers}`;
      recapBody.textContent = [
        service?.title,
        data.arrival ? `${data.departure} → ${data.arrival}` : data.departure,
        `${dt}, ${data.timeTbd ? cfg.labels?.timeTbd : `${data.time} (Europe/Paris)`}`,
        pax,
      ].filter(Boolean).join(' · ');
      go(2);
    };
    $<HTMLButtonElement>('[data-next]')!.addEventListener('click', toStep2);
    $<HTMLButtonElement>('[data-back]')!.addEventListener('click', () => go(1));

    // Demo: fictional example (date = Paris today + N days, at the given time).
    const ex = cfg.example;
    $<HTMLButtonElement>('[data-example]')?.addEventListener('click', () => {
      if (!ex) return;
      const set = (name: string, value: string) => {
        const el = form.elements.namedItem(name) as HTMLInputElement | null;
        if (el && 'value' in el) el.value = value;
      };
      select.value = ex.serviceId;
      set('departure', ex.from);
      set('arrival', ex.to);
      set('date', addDays(parisNow().date, ex.daysFromToday));
      set('time', ex.time);
      const tbd = $<HTMLInputElement>('[data-time-tbd]');
      if (tbd) tbd.checked = false;
      set('passengers', String(ex.passengers));
      set('luggage', ex.luggage);
      set('luggageDetail', ex.luggageDetail);
      const oneway = form.querySelector<HTMLInputElement>('input[name="tripType"][value="oneway"]');
      if (oneway) oneway.checked = true;
      set('name', ex.name);
      const method = form.querySelector<HTMLInputElement>(`input[name="contactMethod"][value="${ex.contactMethod}"]`);
      if (method) method.checked = true;
      set('email', ex.email);
      set('phone', ex.phone);
      set('details', ex.message);
      syncConditional();
      showErrors({});
      $<HTMLInputElement>('input[name="departure"]')?.focus();
    });
  }

  // ----- submission ------------------------------------------------------------
  const setBusy = (busy: boolean) => {
    submitting = busy;
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    submitBtn.textContent = busy ? cfg.labels?.sending ?? '…' : submitLabel;
  };
  const showError = (msg: string) => {
    errorText.textContent = msg;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ block: 'center', behavior: 'auto' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return; // double click / double tap
    errorBox.hidden = true;
    const data = formData(form);
    const result = cfg.kind === 'devis' ? validateQuote(data, ctx()) : validateContact(data, channels);
    const order = [...QUOTE_STEP1, 'name', 'contactMethod', 'email', 'phone', 'details', 'message'];
    if (!result.ok) {
      showErrors(result.errors);
      if (cfg.kind === 'devis' && QUOTE_STEP1.some((n) => result.errors[n])) go(1);
      return focusFirst(result.errors, order);
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
        if (cfg.kind === 'devis' && QUOTE_STEP1.some((n) => body.errors![n])) go(1);
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

  // ----- outcome ------------------------------------------------------------------
  const summaryBox = $<HTMLElement>('[data-summary]');
  const copyBtn = $<HTMLButtonElement>('[data-copy-summary]');
  const copyFeedback = $<HTMLElement>('[data-copy-feedback]');
  let summaryText = '';

  function done(body: ApiResponse) {
    form.classList.add('is-done');
    const notice = $<HTMLElement>('[data-done-notice]')!;
    const simulated = body.status === 'simulated';
    notice.classList.remove('notice--ok', 'notice--test');
    notice.classList.add(simulated && !cfg.demo ? 'notice--test' : 'notice--ok');
    $<HTMLElement>('[data-done-text]')!.textContent = body.message ?? (cfg.kind === 'devis' ? cfg.status.quoteSent : cfg.status.contactSent);
    $<HTMLElement>('[data-done-extra]')!.textContent = cfg.kind === 'devis' ? cfg.status.notConfirmed : '';
    if (summaryBox && body.summary) {
      const list = summaryBox.querySelector<HTMLElement>('[data-summary-list]')!;
      list.replaceChildren(
        ...body.summary.rows.flatMap((r) => {
          const dt = document.createElement('dt');
          dt.textContent = r.label;
          const dd = document.createElement('dd');
          dd.textContent = r.value;
          return [dt, dd];
        }),
      );
      const fare = summaryBox.querySelector<HTMLElement>('[data-summary-fare]')!;
      fare.replaceChildren();
      if (body.summary.fare.kind === 'reference') {
        const strong = document.createElement('strong');
        strong.textContent = cfg.labels?.fareReference ?? '';
        fare.append(strong);
      }
      body.summary.fare.lines.forEach((l) => {
        const p = document.createElement('p');
        p.textContent = l;
        fare.append(p);
      });
      const ref = summaryBox.querySelector<HTMLElement>('[data-summary-ref]')!;
      ref.textContent = body.reference ? `${cfg.labels?.reference} : ${body.reference}` : '';
      summaryText = [cfg.labels?.summary, body.reference ? `${cfg.labels?.reference} : ${body.reference}` : '', ...body.summary.rows.map((r) => `${r.label} : ${r.value}`), ...body.summary.fare.lines]
        .filter(Boolean)
        .join('\n');
      summaryBox.hidden = false;
      if (copyBtn && navigator.clipboard) copyBtn.hidden = false;
    }
    doneBox.hidden = false;
    doneBox.focus();
    doneBox.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      if (copyFeedback) copyFeedback.textContent = cfg.labels?.copied ?? '';
    } catch {
      if (copyFeedback) copyFeedback.textContent = cfg.labels?.copyFailed ?? '';
    }
  });
  const reopen = () => {
    form.classList.remove('is-done');
    doneBox.hidden = true;
    if (summaryBox) summaryBox.hidden = true;
    if (copyFeedback) copyFeedback.textContent = '';
    setBusy(false);
  };
  // "Modifier ma demande": back to the form with every value kept.
  $<HTMLButtonElement>('[data-edit]')?.addEventListener('click', () => {
    reopen();
    go(1);
  });
  // "Recommencer": empty form, new request id.
  $<HTMLButtonElement>('[data-restart]')?.addEventListener('click', () => {
    reopen();
    form.reset();
    ridInput.value = newRequestId();
    syncConditional();
    go(1);
  });
}

export function enhanceForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((f) => {
    if (!f.classList.contains('is-enhanced')) enhance(f);
  });
}
