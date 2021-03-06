describe("mocnina", function() {

  describe("umocní x na 3", function() {

    function vytvořTest(x) {
      let očekáváno = x * x * x;
      it(`${x} na 3 je ${očekáváno}`, function() {
        assert.equal(mocnina(x, 3), očekáváno);
      });
    }

    for (let x = 1; x <= 5; x++) {
      vytvořTest(x);
    }

  });

  it("je-li n záporné, výsledek je NaN", function() {
    assert.isNaN(mocnina(2, -1));
  });

  it("je-li n necelé, výsledek je NaN", function() {
    assert.isNaN(mocnina(2, 1.5));
  });

});
