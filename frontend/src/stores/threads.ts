import { reactive } from 'vue';
import { defineStore } from 'pinia';

export type Thread = {
	id: number,
	parent: number|null,
	name: string,
	created: Date,
	num_children: number
}

export const useThreadsStore = defineStore('threads', () => {
	const threads :Map<number,Thread> = reactive(new Map); 

	async function loadThreads(root:number, threads:Set<number>) {
		const resp = await fetch('/api/threads/'+root+'?threads='+Array.from(threads).join(","));
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		const ids :number[] = []; 
		data.forEach( d => {
			const id = ingestThread(d);
			ids.push(id);
		});
		return ids;
	}
	async function getLatestSubThreads(root:number, limit: number) {
		const resp = await fetch('/api/threads/'+root+'?deep=true&limit='+limit);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		const ids :number[] = []; 
		data.forEach( d => {
			const id = ingestThread(d);
			ids.push(id);
		});
		return ids;
	}
	async function loadChildren(root:number, limit: number) {
		const resp = await fetch('/api/threads/'+root+'?limit='+limit);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		data.forEach( ingestThread );
	}

	function ingestThread(raw:any) {
		const id = parseInt(raw.id);
		let existing = threads.get(id);
		if( existing ) Object.assign(existing, {
			id,
			name: raw.name+'',
			created: new Date(raw.created),
			parent: raw.parent_id,
			num_children: Number(raw.num_children)
		});
		else {
			threads.set(id, {
				id,
				name: raw.name+'',
				created: new Date(raw.created),
				parent: raw.parent_id,
				num_children: Number(raw.num_children)
			});
		}
		return id;
	}
	function addExternallyCreatedThread(id:number, parent_id: number, name: string, created:Date) {
		mustGetThread(parent_id).num_children++;	//sporty
		threads.set(id, {
			id,
			name: name+'',
			created: created,
			parent: parent_id,
			num_children: 0	// just created so the assumption is there are no children...
		});
	}
	function getChildren(thread: number) {
		const ret :Thread[] = [];
		threads.forEach(t => {
			if( t.parent === thread ) ret.push(t);
		});
		return ret;
	}

	function getThread(id:number) :Thread|undefined {
		return threads.get( id );
	}
	function mustGetThread(id:number) :Thread {
		const t = getThread(id);
		if( !t ) throw new Error("could not find thread "+id);
		return t;
	}

	const lazy_load_threads :Set<number> = new Set;
	function addLazyLoadThread(id:number) :Thread {
		let existing = threads.get(id);
		if( existing ) return existing;

		threads.set(id, {
			id,
			name: 'loading thread...',
			created: new Date(),
			parent: null,
			num_children: 0
		});

		lazy_load_threads.add(id);
		
		return threads.get(id)!;	// we just added the id to threads, so it's not undefined
	}
	async function fetchLazyLoadThreads(root: number) {
		if( lazy_load_threads.size === 0 ) return;
		loadThreads(root, lazy_load_threads);
		lazy_load_threads.clear();
	}

	async function updateThread(thread_id:number, parent_id:number, name:string) {
		const thread = mustGetThread(thread_id);

		const rawResponse = await fetch('/api/threads/'+thread_id, {
			method: 'PATCH',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				parent_id,
				name
			})
		});

		if( rawResponse.status !== 200 ) {
			alert("Got error trying to update thread");
			return;
		}

		thread.name = name;

		if( thread.parent !== parent_id ) {
			if( thread.parent !== null ) {
				const og_parent = getThread(thread.parent);
				if( og_parent ) og_parent.num_children--;
			}
			const new_parent = getThread(parent_id);
			if( new_parent ) new_parent.num_children++;
			thread.parent = parent_id;
			// an alternative to all this is to reload threads, if at all possible?
			// like send up all threads we have visible and get all?
		}
	}

	return {
		loadThreads, getLatestSubThreads, loadChildren, getChildren,
		addLazyLoadThread, fetchLazyLoadThreads,
		addExternallyCreatedThread,
		getThread, mustGetThread,
		updateThread
	};

});