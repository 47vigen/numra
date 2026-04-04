import "raqam/locales/fa"
import { NumberField } from "raqam"

export type LiveDemoVariant = "currency" | "quantity" | "persian"

const captions: Record<LiveDemoVariant, string> = {
  currency: "Type 1234 — live currency formatting, cursor-stable.",
  quantity: "Integer field with min 0 and steppers.",
  persian: "Type Persian digits — normalized and re-formatted for fa-IR."
}

export function LiveNumberFieldDemo({
  variant,
  className = ""
}: {
  variant: LiveDemoVariant
  className?: string
}) {
  const rtl = variant === "persian"

  return (
    <div className={`raqam-demo-shell ${className}`.trim()}>
      <div className={`raqam-demo ${rtl ? "raqam-demo--rtl" : ""}`.trim()}>
        {variant === "currency" && (
          <NumberField.Root
            locale="en-US"
            minValue={0}
            defaultValue={123456}
            formatOptions={{ style: "currency", currency: "USD" }}
          >
            <NumberField.Label className="raqam-demo__label">
              Price
            </NumberField.Label>
            <NumberField.Group className="raqam-demo__group">
              <NumberField.Decrement className="raqam-demo__btn">
                −
              </NumberField.Decrement>
              <NumberField.Input className="raqam-demo__input" />
              <NumberField.Increment className="raqam-demo__btn">
                +
              </NumberField.Increment>
            </NumberField.Group>
            <NumberField.HiddenInput />
          </NumberField.Root>
        )}
        {variant === "quantity" && (
          <NumberField.Root locale="en-US" defaultValue={1} minValue={0}>
            <NumberField.Label className="raqam-demo__label">
              Quantity
            </NumberField.Label>
            <NumberField.Group className="raqam-demo__group">
              <NumberField.Decrement className="raqam-demo__btn">
                −
              </NumberField.Decrement>
              <NumberField.Input className="raqam-demo__input" />
              <NumberField.Increment className="raqam-demo__btn">
                +
              </NumberField.Increment>
            </NumberField.Group>
          </NumberField.Root>
        )}
        {variant === "persian" && (
          <NumberField.Root locale="fa-IR" defaultValue={0}>
            <NumberField.Label className="raqam-demo__label">
              مبلغ (fa-IR)
            </NumberField.Label>
            <NumberField.Group className="raqam-demo__group">
              <NumberField.Decrement className="raqam-demo__btn">
                −
              </NumberField.Decrement>
              <NumberField.Input className="raqam-demo__input" />
              <NumberField.Increment className="raqam-demo__btn">
                +
              </NumberField.Increment>
            </NumberField.Group>
          </NumberField.Root>
        )}
        <p className="raqam-demo__caption">{captions[variant]}</p>
      </div>
    </div>
  )
}
