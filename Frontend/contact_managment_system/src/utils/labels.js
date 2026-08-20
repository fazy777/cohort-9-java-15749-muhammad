/**
 * Returns the styling CSS class for email/phone badge labels.
 * @param {string} [label]
 * @returns {string}
 */
export const getLabelClass = (label) => {
  switch (label?.toUpperCase()) {
    case 'WORK':
      return 'badge-work';
    case 'PERSONAL':
      return 'badge-personal';
    case 'HOME':
      return 'badge-home';
    case 'MOBILE':
      return 'badge-mobile';
    default:
      return 'badge-other';
  }
};
