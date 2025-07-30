function sanitizeReply(content) {
  return content
    .replace(/@everyone/g, 'everyone')
    .replace(/@here/g, 'here')
    .replace(/<@&?\d+>/g, '[ping removed]');
}

module.exports = sanitizeReply;
