import { render, screen } from "@testing-library/react";
import { App } from "./App";

// Test de fumée du Sprint 0 : vérifie que la chaîne React + Vitest fonctionne.
test("affiche le nom de l'application", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Cadre" })).toBeInTheDocument();
});
