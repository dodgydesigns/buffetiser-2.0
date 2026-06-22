export const PORTFOLIO_CHANGED_EVENT = "buffetiser:portfolio-changed";

export function notifyPortfolioChanged() {
  window.dispatchEvent(new Event(PORTFOLIO_CHANGED_EVENT));
}
