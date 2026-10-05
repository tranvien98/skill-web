// Giống owlla_frontend: "/skills/{0}".format(id)
if (!String.prototype.format) {
  String.prototype.format = function () {
    const args = arguments;
    return this.replace(/{(\d+)}/g, (match, number) => (typeof args[number] !== "undefined" ? args[number] : ""));
  };
}
