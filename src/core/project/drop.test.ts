import { decideDrop } from "./drop";

describe("décision sur un glisser-déposer", () => {
  test("test_ac_001_2_un_seul_element_depose_est_candidat_a_l_ouverture", () => {
    expect(decideDrop(["/home/lea/mon-projet"])).toEqual({
      kind: "candidate",
      path: "/home/lea/mon-projet",
    });
  });
});
