import { createFileRoute } from "@tanstack/react-router";
import { KisanSetuApp } from "../index";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "KisanSetu AI — Farm Command Centre" }, { name: "description", content: "Crop health, mandi intelligence, irrigation and direct farm markets." }] }),
  component: KisanSetuApp,
});
