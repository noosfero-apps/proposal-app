define(["model/main"],function(Main){

  describe("addVotedProposal", function(){
    it("Should register a voted id", function(){
        expect(Main.addVotedProposal(1)).toContain(1);

    });
  });
});
