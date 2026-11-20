/**
 * Cookie saved once a visitor starts their first check-in from the welcome
 * page. While it is missing, opening "/" shows the welcome page instead of
 * the home screen. It only remembers "already welcomed": no tracking.
 */
export const WELCOMED_COOKIE = "embr-welcomed";
