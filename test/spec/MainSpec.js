define(["model/main"],function(){

  describe("addVotedProposal", function(){
    it("Should register a voted id", function(){
        addVotedProposal(1).toEqual(true);
    });
  });
});
