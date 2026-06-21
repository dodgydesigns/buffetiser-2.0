import PurchaseModal, { type PurchaseModalProps } from "./purchase_modal";

type NewPurchaseModalProps = Omit<
  PurchaseModalProps,
  "investment" | "editableInvestment"
>;

export default function NewPurchaseModal(props: NewPurchaseModalProps) {
  return (
    <PurchaseModal
      {...props}
      investment={{ symbol: "", name: "" }}
      editableInvestment
    />
  );
}
