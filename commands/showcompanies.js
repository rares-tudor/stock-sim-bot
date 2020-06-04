module.exports = {
    name: 'showcompanies',
    description: 'Shows all registered companies.',
    async execute() {
        const coList = await Companies.findAll({attributes: ['name']});
        const coString = coList.map(c => c.name).join(', ') || 'No tags set';
        return msg.channel.send(`List of companies registered: ${coString}`);
    }
}