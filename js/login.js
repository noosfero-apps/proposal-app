var privateToken;

function handleLoginResult(loggedIn, token) {
  privateToken = token;
  jQuery('#login #private-token').val(privateToken); //FIXME remove
}
