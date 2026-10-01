import { decideDrop } from "./drop";

describe("décision sur un glisser-déposer", () => {
  test("test_ac_001_2_un_seul_element_depose_est_candidat_a_l_ouverture", () => {
    expect(decideDrop(["/home/lea/mon-projet"])).toEqual({
      kind: "candidate",
      path: "/home/lea/mon-projet",
    });
  });

  test("test_ac_001_3_plusieurs_elements_deposes_sont_refuses", () => {
    expect(decideDrop(["/home/lea/a", "/home/lea/b"])).toEqual({ kind: "rejected" });
  });

  test("test_ac_001_3_depot_sans_aucun_element_est_refuse", () => {
    expect(decideDrop([])).toEqual({ kind: "rejected" });
  });
});
