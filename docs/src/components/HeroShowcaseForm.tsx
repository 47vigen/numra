import "raqam/locales/fa";
import { NumberField, presets } from "raqam";

/**
 * Full interactive hero form: currency, percent, accounting, unit, scrub, fa-IR.
 * Styled via `hero-showcase.css` (Starlight customCss).
 */
export function HeroShowcaseForm() {
  return (
    <div className="hero-showcase">
      <header className="hero-showcase__header">
        <p className="hero-showcase__eyebrow">Interactive</p>
        <h2 className="hero-showcase__title">One form, every surface</h2>
        <p className="hero-showcase__lede">
          Currency, percent, accounting, units, scrub, and Persian i18n — all headless, all accessible.
        </p>
      </header>

      <form
        className="hero-showcase__form"
        aria-label="raqam feature showcase"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="hero-showcase__grid">
          <div className="hero-showcase__field">
            <NumberField.Root
              locale="en-US"
              formatOptions={presets.currency("USD")}
              defaultValue={129}
              minValue={0}
              step={1}
            >
              <NumberField.Label className="hero-showcase__label">Subtotal</NumberField.Label>
              <NumberField.Description className="hero-showcase__desc">
                Live currency · steppers · keyboard nudging
              </NumberField.Description>
              <NumberField.Group className="hero-showcase__group">
                <NumberField.Decrement className="hero-showcase__btn">−</NumberField.Decrement>
                <NumberField.Input className="hero-showcase__input" />
                <NumberField.Increment className="hero-showcase__btn">+</NumberField.Increment>
              </NumberField.Group>
              <NumberField.HiddenInput />
            </NumberField.Root>
          </div>

          <div className="hero-showcase__field">
            <NumberField.Root
              locale="en-US"
              formatOptions={{
                ...presets.percent,
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              }}
              defaultValue={0.0825}
              minValue={0}
              maxValue={1}
              step={0.01}
            >
              <NumberField.Label className="hero-showcase__label">Tax rate</NumberField.Label>
              <NumberField.Description className="hero-showcase__desc">
                Percent style (stored 0–1). Step ±1 pt (e.g. 8.25% → 9.25%).
              </NumberField.Description>
              <NumberField.Group className="hero-showcase__group">
                <NumberField.Decrement className="hero-showcase__btn">−</NumberField.Decrement>
                <NumberField.Input className="hero-showcase__input" />
                <NumberField.Increment className="hero-showcase__btn">+</NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </div>

          <div className="hero-showcase__field hero-showcase__field--span">
            <NumberField.Root locale="en-US" defaultValue={78} minValue={0} maxValue={100} step={1}>
              <div className="hero-showcase__scrub-row">
                <NumberField.ScrubArea
                  direction="horizontal"
                  pixelSensitivity={2}
                  className="hero-showcase__scrub"
                >
                  <NumberField.Label className="hero-showcase__scrub-label">Opacity</NumberField.Label>
                </NumberField.ScrubArea>
                <NumberField.Input className="hero-showcase__input hero-showcase__input--narrow" />
              </div>
              <NumberField.Description className="hero-showcase__desc">
                Drag the label horizontally to scrub · 0–100
              </NumberField.Description>
            </NumberField.Root>
          </div>

          <div className="hero-showcase__field">
            <NumberField.Root
              locale="en-US"
              formatOptions={presets.accounting("USD")}
              defaultValue={-2400}
              allowNegative
            >
              <NumberField.Label className="hero-showcase__label">Ledger (accounting)</NumberField.Label>
              <NumberField.Description className="hero-showcase__desc">
                Parentheses for negatives · currencySign accounting
              </NumberField.Description>
              <NumberField.Group className="hero-showcase__group">
                <NumberField.Input className="hero-showcase__input" />
              </NumberField.Group>
            </NumberField.Root>
          </div>

          <div className="hero-showcase__field">
            <NumberField.Root
              locale="en-US"
              formatOptions={presets.unit("kilometer")}
              defaultValue={42.5}
              minValue={0}
              step={0.1}
            >
              <NumberField.Label className="hero-showcase__label">Distance</NumberField.Label>
              <NumberField.Description className="hero-showcase__desc">
                Unit style · kilometer · step 0.1 km · steppers
              </NumberField.Description>
              <NumberField.Group className="hero-showcase__group">
                <NumberField.Decrement className="hero-showcase__btn">−</NumberField.Decrement>
                <NumberField.Input className="hero-showcase__input" />
                <NumberField.Increment className="hero-showcase__btn">+</NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </div>

          <div className="hero-showcase__field hero-showcase__field--span hero-showcase__field--rtl">
            <NumberField.Root locale="fa-IR" defaultValue={1250000} minValue={0} step={1000}>
              <NumberField.Label className="hero-showcase__label">مبلغ فاکتور (fa-IR)</NumberField.Label>
              <NumberField.Description className="hero-showcase__desc">
                Persian digits + locale plugin · RTL field
              </NumberField.Description>
              <NumberField.Group className="hero-showcase__group">
                <NumberField.Decrement className="hero-showcase__btn">−</NumberField.Decrement>
                <NumberField.Input className="hero-showcase__input" dir="rtl" />
                <NumberField.Increment className="hero-showcase__btn">+</NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </div>
        </div>
      </form>
    </div>
  );
}
