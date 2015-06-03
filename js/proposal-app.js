define(['jquery','jquery_cookie'],function($){


  ProposalApp = (function (){

    return {
      addVotedProposal: function(id) {
       var votedProposals;
       if (typeof($.cookie("votedProposals")) == "undefined"){
         votedProposals = [];
       }
       else{
         votedProposals = JSON.parse($.cookie("votedProposals"));
       }
       if (votedProposals.indexOf(id)==-1){
         votedProposals.push(id);
       }
       $.cookie("votedProposals", JSON.stringify(votedProposals), {expires : 999 }) ;
       return votedProposals;
      },

      hasProposalbeenVoted: function(id) {
       if (typeof($.cookie("votedProposals")) == "undefined") {
         return false;
       }
       votedProposals = JSON.parse($.cookie("votedProposals"));
       return votedProposals.indexOf(id)!=-1;
      }
    };

  })();

  return ProposalApp;
});
