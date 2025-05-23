class CollectionsRepositoryInterface {
  async create(data, client) {}
  async update(id, data, client) {}
  async removeByNameAndProjectId(name, projectId, client) {}
  async generateId() {}
  async createCollectionTable(deviceId, schemaFields) {}
  async makeCollectionRules(deviceId) {}
  async getSchemaFieldsByDeviceId(deviceId) {}
}

module.exports = CollectionsRepositoryInterface;
