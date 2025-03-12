import { Component, HostListener, OnInit, Input } from '@angular/core';
import { AuthService } from '../../firebase-service/auth.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Todo } from '../../interfaces/todos';
import { TodoListService } from '../../firebase-service/todo-list.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  animations: [
    trigger('moveText', [
      state(
        'center',
        style({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 1,
          backgroundColor: '#f6f7f8',
        })
      ),
      state(
        'moved',
        style({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          backgroundColor: 'transparent',
        })
      ),
      transition('center => moved', animate('1s ease-in-out')),
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 1 })])]),
  ],
})
export class SummaryComponent implements OnInit {
  @Input() todo!: Todo;
  displayName: string | null = '';
  greeting: string = '';
  textState: 'center' | 'moved' = 'center';
  isMobileView: boolean = false;
  todoList: Todo[] = [];
  awaitFeedbackList: Todo[] = [];
  inProgressList: Todo[] = [];
  doneList: Todo[] = [];
  urgentNearestDueDate: string | null = null;
  showText: boolean = true;

  constructor(
    private authService: AuthService,
    private todoListService: TodoListService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.displayName = user.displayName;
    }
    this.greeting = this.getGreeting();

    setTimeout(() => {
      this.textState = 'moved';
    }, 2000);

    setTimeout(() => {
      this.showText = false;
    }, 3000);
  }
  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  getList(listId: string): Todo[] {
    switch (listId) {
      case 'todoList':
        return this.todoListService.todos || [];
      case 'awaitFeedbackList':
        return this.todoListService.awaitfeedbacks || [];
      case 'inProgressList':
        return this.todoListService.inprogress || [];
      case 'doneList':
        return this.todoListService.done || [];
      default:
        return [];
    }
  }

  totalMatches(): number {
    let totalMatches = 0;
    totalMatches += this.getList('todoList').length;
    totalMatches += this.getList('awaitFeedbackList').length;
    totalMatches += this.getList('inProgressList').length;
    totalMatches += this.getList('doneList').length;
    return totalMatches;
  }

  totalUrgent() {
    let allTodos = [
      this.getList('todoList'),
      this.getList('awaitFeedbackList'),
      this.getList('inProgressList'),
      this.getList('doneList'),
    ].flat();
    const urgentTodos = allTodos.filter((todo) => todo.priority === 'urgent');
    this.getNearestDueDate(allTodos);
    return urgentTodos.length;
  }

  getNearestDueDate(
    allTodos: { priority: string; dueDate: string }[]
  ): string | null {
    const urgentTodos = allTodos.filter((todo) => todo.priority === 'urgent');

    if (urgentTodos.length === 0) return null;

    const today = new Date();

    urgentTodos.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });

    const nearestDate = new Date(urgentTodos[0].dueDate);
    const formattedDate = `${nearestDate
      .getDate()
      .toString()
      .padStart(2, '0')}.${(nearestDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${nearestDate.getFullYear()}`;
    this.urgentNearestDueDate = formattedDate;
    return formattedDate;
  }
}
