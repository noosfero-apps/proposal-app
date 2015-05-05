define(['jasmine-boot', 'proposal_app'],function(jasmine, ProposalApp){

  describe("Limit proposal voting to one per browser", function(){
    it("Should register a proposal id", function(){
      expect(ProposalApp.addVotedProposal(99)).toContain(99);
    });

    it("Should find a voted proposal", function(){
      ProposalApp.addVotedProposal(3);
      expect(ProposalApp.hasProposalbeenVoted(3)).toBe(true);
    });

  });

});
