import { render, screen } from "@testing-library/react";
import { SaveBar } from "./SaveBar";

describe("refus d'enregistrement AGENT_EXISTANT (US-079, point à vérifier)", () => {
  test("test_us_079_agent_existant_redit_que_rien_n_a_ete_enregistre", () => {
    render(
      <SaveBar
        modifie
        lectureSeule={false}
        enCours={false}
        erreur={{ code: "AGENT_EXISTANT", detail: "frontend" }}
        onSave={() => undefined}
      />,
    );

    expect(screen.getByRole("alert", { name: "Enregistrement" })).toHaveTextContent(
      "Un agent \"frontend\" existe déjà sur le disque : retirez l'agent non enregistré ou recréez-le sous un autre nom. Rien n'a été enregistré.",
    );
  });
});
