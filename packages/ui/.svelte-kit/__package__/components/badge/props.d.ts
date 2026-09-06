export type BadgeProps = {
    /** The count, as digits. Nothing enforces that it is numeric and nothing caps its length: the badge hugs, so a four-digit number simply widens it. Where a cap is wanted, the consumer applies it and passes the capped string. */
    numberText?: string;
    /** Which text colour role the badge takes as its surface. There is one tone per text role and the mapping is exact — tone X paints the surface with `text/X` — which is why the list is as long as it is and why it is not a list of semantic slots. The label takes the opposing role: `text/inverted` against every dark surface, `text/base` against `inverted`, and each static role against the other. */
    tone?: "base" | "secondary" | "tertiary" | "primary" | "warning" | "danger" | "success" | "inverted" | "static light" | "static dark" | "disabled";
    /** Height, horizontal padding and text measure together. Width is never set: it follows the number, floored at the height. */
    size?: "extra small" | "small" | "medium" | "large" | "extra large";
};
