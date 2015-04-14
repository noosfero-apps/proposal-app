var privateToken;

function oauthPluginHandleLoginResult(loggedIn, token) {
  privateToken = token;
  jQuery('#login #private-token').val(privateToken); //FIXME remove
}
