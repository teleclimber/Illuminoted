<script setup lang="ts">

import { note_editor } from '../main';

const ref_note_id = note_editor.ref_note_id;
const ref_note = note_editor.ref_note;
const thread = note_editor.thread;
const contents = note_editor.contents;

/*
Thought on creating new notes:
- you should be able to pick any note and "reply" to it
  - if it's end of thread, then reply to thread possible (among other options)
  - if not last of thread, then offer to "reply at end of thread" and show note and end of thread
  - offer to thread out
  - offer to link to while replying elsewhere (list of active, recently seen threads)
Also, while authoring a note, should be able to pick out other notes to link to?
*/

// To create new note:
// - select a note
// - click either "reply" (if last of thread), or "thread-out", [or "link to"?]
// - that's it.
// If note selected is not end of thread, there should be a "go to end of thread"
// ..may be hijack the "end" key for that?



</script>

<template>
	<div class="p-2 bg-white border-t-2">
		<p v-if="!ref_note_id">Pick note</p>
		<p v-else-if="thread" class="italic text-amber-800 max-w-prose whitespace-nowrap overflow-clip">Thread: {{thread.root.contents}}</p>
		<p v-else class="whitespace-nowrap overflow-clip">Threading out: {{ref_note!.contents}} </p>

		<template v-if="ref_note_id">
			<div>
				<textarea v-model="contents" class="w-full h-32 border"></textarea>
			</div>

			<div>
				<!-- links to other notes ... -->
			</div>
			
			<div class="flex justify-between">
				<button @click.stop.prevent="note_editor.reset()">reset</button>
				<button @click.stop.prevent="note_editor.saveNote()">Save</button>
			</div>
		</template>
	</div>

</template>