# levireg-console

Admin dashboard for the personal website. A browser app that Users sign in to and that talks to levireg-core. Shares levireg-core's vocabulary (User, Approved User, Pending User, Role, Superadmin); terms below are the ones this app adds or sharpens.

## Language

**Session**:
A User's proof of having signed in, issued by levireg-core and identified by an opaque token. Ends on sign out, on expiry, or when levireg-core revokes it.
_Avoid_: login, auth, logged-in state

**Sign in**:
An Approved User exchanging username and password for a new Session.
_Avoid_: login, log in, authenticate

**Sign out**:
Ending the current Session on purpose.
_Avoid_: logout, log out

**Signed in**:
The console's state while it holds a Session levireg-core still accepts. Anything else is **signed out**.
_Avoid_: logged in, authenticated
