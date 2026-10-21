<script lang="ts">
  // Any mark in the preset's catalogue, imported on its own and registered —
  // packages/ui/README.md#icons. These three are outside the registered set.
  import { Icon, registerIcons } from "@stylos/ui";
  import rocketLaunch from "@stylos/ui/icons/rocket_launch";
  import deleteForever from "@stylos/ui/icons/delete_forever";
  import thumbUp from "@stylos/ui/icons/thumb_up";

  registerIcons(rocketLaunch, deleteForever, thumbUp);

  let { name = "rocket_launch" }: { name?: string } = $props();
</script>

<Icon {name} />
