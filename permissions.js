export const PERMISSIONS = {
  super_admin: {
    create: true,
    edit: true,
    approve: true,
    export: true,
    admin_permissions: true,
    view: true,
  },

  // region_admin: {
  //   create: true,
  //   edit: true,
  //   approve: "region_only",
  //   export: true,
  //   admin_permissions: "region_scopes",
  //   view: true,
  // },

  admin: {
    create: true,
    edit: true,
    approve: "region_only",
    export: true,
    admin_permissions: "region_scopes",
    view: true,
  },

  viewer: {
    view: true,
  },

  // maker: {
  //   create: true,
  //   edit: true,
  //   approve: false,
  //   export: false,
  //   admin_permissions: false,
  //   view: true,
  // },

  // checker: {
  //   approve: true,
  //   export: true,
  //   create: false,
  //   edit: "during_review",
  //   admin_permissions: false,
  //   view: true,
  // },
};
