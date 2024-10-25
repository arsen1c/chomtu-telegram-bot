import randomAnimals from '../../services/getAnimals.js';

export default {
  name: 'cat',
  description: 'Random cats',
  args: false,
  chatAction: 'upload_photo',
  async execute(ctx, args) {
    let catLink = await randomAnimals.getCat();
    if (catLink.includes('gif')) return ctx.replyWithVideo(catLink);
    ctx.replyWithPhoto(catLink);
  },
};
