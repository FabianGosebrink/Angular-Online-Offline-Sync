import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import Dexie from 'dexie';
import { Todo } from '../models/todo';
import { OnlineOfflineService } from './online-offline.service';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos: Todo[] = [];
  private db: any;

  constructor(private readonly onlineOfflineService: OnlineOfflineService) {
    onlineOfflineService.connectionChanged.subscribe(online => {
      if (online) {
        console.log('went online');
        console.log('sending all stored items');
        this.sendItemsFromIndexedDb();
      } else {
        console.log('went offline, storing in indexdb');
      }
    });

    this.db = new Dexie('MyTestDatabase');
    this.db.version(1).stores({
      todos: 'id,value,done'
    });
  }

  addTodo(todo: Todo) {
    todo.id = UUID.UUID();
    todo.done = false;
    this.todos.push(todo);

    if (!this.onlineOfflineService.isOnline) {
      this.addToIndexedDb(todo);
    }
  }

  getAllTodos() {
    return this.todos;
  }

  private addToIndexedDb(todo: Todo) {
    this.db.todos
      .add(todo)
      .then(async () => {
        const allItems: Todo[] = await this.db.todos.toArray();
        console.log('saved in DB, DB is now', allItems);
      })
      .catch(e => {
        alert('Error: ' + (e.stack || e));
      });
  }

  private async sendItemsFromIndexedDb() {
    const allItems: Todo[] = await this.db.todos.toArray();
    allItems.forEach((item: Todo) => {
      this.db.todos.delete(item.id).then(() => {
        console.log(`item ${item.id} sent and deleted locally`);
      });
    });
  }
}
