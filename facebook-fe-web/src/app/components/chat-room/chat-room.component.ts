import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { MessagePaginateI } from '../../model/message.interface';
import { RoomI } from '../../model/room.interface';
import { ChatService } from '../../services/chat-service/chat.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ChatMessageComponent,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() chatRoom: RoomI = {};
  @ViewChild('messages', { static: true })
  messagesScroller?: ElementRef<HTMLDivElement>;
  messagesPaginate$: Observable<MessagePaginateI> = combineLatest([
    this.chatService.getMessages(),
    this.chatService.getAddedMessage().pipe(startWith(null)),
  ]).pipe(
    map(([messagePaginate, message]) => {
      if (
        message &&
        message.room.id === this.chatRoom.id &&
        !messagePaginate.items.some((m) => m.id === message.id)
      ) {
        messagePaginate.items.push(message);
      }
      const items = messagePaginate.items.sort(
        (a, b) =>
          new Date(a.created_at ?? '').getTime() -
          new Date(b.created_at ?? '').getTime()
      );
      messagePaginate.items = items;
      return messagePaginate;
    }),
    tap(() => this.scrollToBottom())
  );

  chatMessage: FormControl = new FormControl(null, [Validators.required]);

  constructor(private chatService: ChatService) {}

  ngOnChanges(changes: SimpleChanges) {
    this.chatService.leaveRoom(changes['chatRoom'].previousValue);
    if (this.chatRoom) {
      this.chatService.joinRoom(this.chatRoom);
    }
  }

  ngAfterViewInit() {
    if (this.messagesScroller) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    this.chatService.leaveRoom(this.chatRoom);
  }

  sendMessage() {
    this.chatService.sendMessage({
      text: this.chatMessage.value,
      room: this.chatRoom,
    });
    this.chatMessage.reset();
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.messagesScroller!.nativeElement.scrollTop =
          this.messagesScroller!.nativeElement.scrollHeight;
      }, 1);
    } catch {}
  }
}
