  /**
   * assets/js/script.js
   * -------------------------------------------------------------------
   * Lógica de interatividade do Sistema de Agendamento CIT.
   * Todo o "banco de dados" deste protótipo vive no localStorage do
   * navegador (chave CIT_CANVA_RECORDS): agendamentos, equipamentos,
   * permissões individuais e mensagens de contato são gravados como
   * registros de um único array, diferenciados pelo campo record_type.
   *
   * A autenticação do administrador (quem pode acessar esta página)
   * é feita no lado do servidor por config.php/login.php; este arquivo
   * cuida apenas do comportamento da interface já autenticada.
   * -------------------------------------------------------------------
   */

  const STORAGE_KEY = 'CIT_CANVA_RECORDS';
  let bookings = [];
  let allRecords = [];
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null;

    // Configuração padrão (fallback), usada caso window.SERVER_CONFIG
    // não tenha sido definido pelo footer.php — por exemplo, se este
    // script for aberto fora do fluxo normal da aplicação PHP.
    const defaultConfig = {
      site_title: 'Sistema de Agendamento CIT',
      institution_name: 'Instituto Federal de Rondônia',
      contact_email: 'cit@ifro.edu.br',
      contact_phone: '(69) 3211-0000'
    };

    // Mescla o padrão acima com o que veio do servidor (config.php),
    // dando prioridade aos valores do servidor quando existirem.
    const resolvedConfig = Object.assign({}, defaultConfig, window.SERVER_CONFIG || {});

    const timeSlots = [
      '08:00 - 10:00',
      '10:00 - 12:00',
      '14:00 - 16:00',
      '16:00 - 18:00',
      '18:00 - 20:00',
      '20:00 - 22:00'
    ];

    // Aplica os textos institucionais (nome, e-mail, telefone) vindos da
    // configuração mesclada (servidor + padrão) aos elementos da página.
    function applyConfig(config) {
      const institutionName = config.institution_name || defaultConfig.institution_name;
      const contactEmail = config.contact_email || defaultConfig.contact_email;
      const contactPhone = config.contact_phone || defaultConfig.contact_phone;

      document.getElementById('nav-institution').textContent = institutionName;
      document.getElementById('footer-institution').textContent = institutionName;
      document.getElementById('contact-email-display').textContent = contactEmail;
      document.getElementById('contact-phone-display').textContent = contactPhone;
    }

    // Relê o localStorage e atualiza as variáveis em memória: allRecords
    // (todos os tipos de registro) e bookings (apenas agendamentos).
    function refreshRecords() {
      allRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      bookings = allRecords.filter(item => !item.record_type || item.record_type === 'booking');
    }

    // Persiste allRecords no localStorage e dispara a atualização de toda
    // a interface (painéis públicos e administrativos).
    function saveRecords() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
      refreshRecords();
      updateUI();
      renderAdminPanels();
    }

    // Cria um novo registro (agendamento, equipamento, permissão ou
    // contato) simulando uma chamada de API assíncrona ao backend.
    async function localCreate(record) {
      allRecords.push({ ...record, __backendId: record.__backendId || `local-${Date.now()}-${Math.random().toString(36).slice(2)}` });
      saveRecords();
      return { isOk: true };
    }

    // Atualiza um registro existente, localizado pelo seu __backendId.
    async function localUpdate(record) {
      const index = allRecords.findIndex(item => item.__backendId === record.__backendId);
      if (index < 0) return { isOk: false };
      allRecords[index] = record;
      saveRecords();
      return { isOk: true };
    }

    // Remove um registro existente, localizado pelo seu __backendId.
    async function localDelete(record) {
      allRecords = allRecords.filter(item => item.__backendId !== record.__backendId);
      saveRecords();
      return { isOk: true };
    }

    // Recalcula e redesenha todos os blocos dinâmicos da página inicial
    // (estatísticas, listas, relatórios, calendário e horários do dia).
    function updateUI() {
      updateStats();
      updateBookingsList();
      updatePendingRequests();
      updateReports();
      updateActivityLog();
      renderCalendar();
      renderBookingEquipmentChoices();
      if (selectedDate) {
        updateTimeSlots(selectedDate);
      }
    }

    // Atualiza os contadores do hero (disponíveis/ocupados/pendentes) com
    // base nos agendamentos aprovados e pendentes.
    function updateStats() {
      const approved = bookings.filter(b => b.status === 'approved').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const total = timeSlots.length * 30;
      const available = total - approved - pending;

      document.getElementById('stat-available').textContent = Math.max(0, available);
      document.getElementById('stat-occupied').textContent = approved;
      document.getElementById('stat-pending').textContent = pending;
    }

    // Renderiza a lista de "Agendamentos Registrados", ordenada por data,
    // limitada aos 10 mais próximos.
    function updateBookingsList() {
      const container = document.getElementById('bookings-list');
      const countEl = document.getElementById('booking-count');
      
      countEl.textContent = `${bookings.length} agendamento${bookings.length !== 1 ? 's' : ''}`;
      
      if (bookings.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4 font-medium">Nenhum agendamento registrado ainda.</p>';
        return;
      }

      const sortedBookings = [...bookings].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      container.innerHTML = sortedBookings.slice(0, 10).map(booking => {
        const statusClass = booking.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                          booking.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
        const statusText = booking.status === 'approved' ? 'Aprovado' : 
                          booking.status === 'pending' ? 'Pendente' : 'Cancelado';
        
        return `
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full ${booking.status === 'approved' ? 'bg-emerald-500' : booking.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}"></div>
              <div>
                <div class="font-bold text-gray-800">${booking.responsible}</div>
                <div class="text-sm text-gray-600 font-medium">${formatDate(booking.date)} • ${booking.time_slot} • ${booking.purpose}</div>
                ${booking.equipment_quantities ? `<div class="text-xs text-gray-500 mt-1">Equipamentos: ${booking.equipment_quantities}${booking.equipment_requests ? ` (${booking.equipment_requests})` : ''}</div>` : ''}
                ${booking.rejection_reason ? `<div class="text-xs text-red-700 mt-1 font-semibold">Motivo da recusa: ${booking.rejection_reason}</div>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 text-xs font-bold rounded-full ${statusClass}">${statusText}</span>
              <button onclick="deleteBooking('${booking.__backendId}')" class="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Excluir">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Renderiza o painel de solicitações pendentes na área administrativa,
    // com os botões de aprovar/recusar.
    function updatePendingRequests() {
      const container = document.getElementById('pending-requests');
      // Sem login, a seção Administração nem é renderizada no HTML
      // (ver includes/main-content.php) — não há o que atualizar aqui.
      if (!container) return;
      const pendingBookings = bookings.filter(b => b.status === 'pending');
      
      if (pendingBookings.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-sm text-center py-4 font-medium">Nenhuma solicitação pendente.</p>';
        return;
      }

      container.innerHTML = pendingBookings.map(booking => `
        <div class="bg-white rounded-lg p-4 border-2 border-green-200">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-bold text-gray-800">${booking.responsible}</div>
              <div class="text-sm text-gray-600 font-medium">${formatDate(booking.date)} • ${booking.time_slot}</div>
            </div>
            <span class="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">${booking.purpose}</span>
          </div>
          ${booking.description ? `<p class="text-sm text-gray-600 mb-3 font-medium">${booking.description}</p>` : ''}
          <div class="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800 font-semibold">
            Equipamentos necessários: ${booking.equipment_quantities || '0'}${booking.equipment_requests ? ` — ${booking.equipment_requests}` : ''}
          </div>
          <div class="flex gap-2">
            <button onclick="approveBooking('${booking.__backendId}')" class="flex-1 px-3 py-2 gradient-ifro text-white text-sm rounded-lg hover:shadow-lg transition-all font-bold">
              Aprovar
            </button>
            <button onclick="openRejectionModal('${booking.__backendId}')" class="flex-1 px-3 py-2 border-2 border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors font-bold">
              Recusar
            </button>
          </div>
        </div>
      `).join('');
    }

    // Recalcula os indicadores da seção de Relatórios: total, aprovados,
    // pendentes, taxa de ocupação e o gráfico de barras por finalidade.
    function updateReports() {
      const total = bookings.length;
      const approved = bookings.filter(b => b.status === 'approved').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const rate = total > 0 ? Math.round((approved / (timeSlots.length * 30)) * 100) : 0;

      document.getElementById('report-total').textContent = total;
      document.getElementById('report-approved').textContent = approved;
      document.getElementById('report-pending').textContent = pending;
      document.getElementById('report-rate').textContent = Math.min(rate, 100) + '%';

      const purposes = ['Aula', 'Projeto', 'Reunião', 'Treinamento'];
      const maxCount = Math.max(...purposes.map(p => bookings.filter(b => b.purpose === p).length), 1);

      purposes.forEach(purpose => {
        const count = bookings.filter(b => b.purpose === purpose).length;
        const barId = 'bar-' + purpose.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const countId = 'count-' + purpose.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        const barEl = document.getElementById(barId);
        const countEl = document.getElementById(countId);
        
        if (barEl) barEl.style.width = (count / maxCount * 100) + '%';
        if (countEl) countEl.textContent = count;
      });

      const othersCount = bookings.filter(b => !purposes.includes(b.purpose)).length;
      const barOutros = document.getElementById('bar-outros');
      const countOutros = document.getElementById('count-outros');
      if (barOutros) barOutros.style.width = (othersCount / maxCount * 100) + '%';
      if (countOutros) countOutros.textContent = othersCount;
    }

    // Mostra as últimas atividades (agendamentos criados/aprovados) em
    // ordem cronológica decrescente, com tempo relativo ("há 5min" etc.).
    function updateActivityLog() {
      const container = document.getElementById('activity-log');
      const recentBookings = [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      
      if (recentBookings.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-sm text-center py-4 font-medium">Nenhuma atividade registrada.</p>';
        return;
      }

      container.innerHTML = recentBookings.map(booking => {
        const action = booking.status === 'approved' ? 'aprovado' : 'solicitado';
        return `
          <div class="flex items-center gap-3 text-sm">
            <div class="w-2 h-2 rounded-full ${booking.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}"></div>
            <span class="flex-1 text-gray-600 font-medium">
              <strong class="text-gray-800">${booking.responsible}</strong> ${action} agendamento para ${formatDate(booking.date)}
            </span>
            <span class="text-gray-400 text-xs font-medium">${getRelativeTime(booking.created_at)}</span>
          </div>
        `;
      }).join('');
    }

    // Desenha os dias do mês corrente no calendário interativo, marcando
    // dias com agendamentos aprovados/pendentes e o dia selecionado.
    function renderCalendar() {
      const container = document.getElementById('calendar-days');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      document.getElementById('calendar-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
      
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const today = new Date();
      
      let html = '';
      
      for (let i = 0; i < firstDay; i++) {
        html += '<div class="p-2"></div>';
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayBookings = bookings.filter(b => b.date === dateStr);
        const hasApproved = dayBookings.some(b => b.status === 'approved');
        const hasPending = dayBookings.some(b => b.status === 'pending');
        const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const isSelected = selectedDate === dateStr;
        const isPast = new Date(dateStr) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        let statusDot = '';
        if (hasApproved && hasPending) {
          statusDot = '<div class="flex gap-0.5 justify-center mt-1"><div class="w-2 h-2 bg-red-500 rounded-full"></div><div class="w-2 h-2 bg-amber-500 rounded-full"></div></div>';
        } else if (hasApproved) {
          statusDot = '<div class="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>';
        } else if (hasPending) {
          statusDot = '<div class="w-2 h-2 bg-amber-500 rounded-full mx-auto mt-1"></div>';
        } else if (!isPast) {
          statusDot = '<div class="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-1"></div>';
        }
        
        const professorNames = dayBookings.map(b => b.responsible).filter(Boolean).slice(0, 2).join(', ');
        html += `
          <button onclick="selectDate('${dateStr}')" title="${professorNames ? 'Agendado por: ' + professorNames : 'Sem agendamentos'}" class="p-3 min-h-[88px] rounded-lg transition-all font-bold border-2 text-left ${isSelected ? 'gradient-ifro text-white border-green-600' : isToday ? 'bg-green-100 text-green-800 border-green-300' : isPast ? 'text-gray-300 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}" ${isPast ? 'disabled' : ''}>
            <div class="text-sm text-center">${day}</div>
            ${statusDot}
            <div class="text-[10px] leading-tight mt-2 text-center ${isSelected ? 'text-white' : 'text-gray-500'}">${professorNames || 'Livre'}</div>
          </button>
        `;
      }
      
      container.innerHTML = html;
    }

    // Avança ou retrocede o calendário em um mês (delta = 1 ou -1),
    // ajustando o ano quando necessário.
    function changeMonth(delta) {
      currentMonth += delta;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    }

    // Marca uma data como selecionada no calendário e exibe os horários
    // daquele dia no painel lateral.
    function selectDate(dateStr) {
      selectedDate = dateStr;
      document.getElementById('selected-date').textContent = formatDate(dateStr);
      updateTimeSlots(dateStr);
      renderCalendar();
    }

    // Lista os períodos fixos do dia (timeSlots) para a data informada,
    // indicando se cada um está disponível, pendente ou aprovado.
    function updateTimeSlots(dateStr) {
      const container = document.getElementById('time-slots');
      const dayBookings = bookings.filter(b => b.date === dateStr);
      
      container.innerHTML = timeSlots.map(slot => {
        const booking = dayBookings.find(b => b.time_slot === slot);
        let statusClass, statusText, bgClass;
        
        if (booking) {
          if (booking.status === 'approved') {
            statusClass = 'bg-red-500';
            statusText = `${booking.purpose} - ${booking.responsible}`;
            bgClass = 'bg-red-50 border-red-200';
          } else {
            statusClass = 'bg-amber-500';
            statusText = `Aguardando aprovação - ${booking.responsible}`;
            bgClass = 'bg-amber-50 border-amber-200';
          }
        } else {
          statusClass = 'bg-emerald-500';
          statusText = 'Disponível';
          bgClass = 'bg-white border-gray-200 hover:border-green-500 cursor-pointer hover:bg-green-50';
        }
        
        return `
          <div onclick="${!booking ? `openBookingModalWithDate('${dateStr}', '${slot}')` : ''}" class="p-3 rounded-lg border-2 ${bgClass} transition-all">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full ${statusClass}"></div>
              <span class="font-bold text-gray-800">${slot}</span>
            </div>
            <div class="text-xs text-gray-600 mt-1 font-medium">${statusText}</div>
            ${booking ? `<button onclick="showBookingDetails('${booking.__backendId}'); event.stopPropagation();" class="mt-2 text-xs font-bold text-green-700 underline">Ver detalhes</button>` : ''}
          </div>
        `;
      }).join('');
    }

    // Exibe um resumo rápido de um agendamento em um toast, ao clicar em
    // "Ver detalhes" em um horário ocupado.
    function showBookingDetails(backendId) {
      const booking = bookings.find(item => item.__backendId === backendId);
      if (!booking) return;
      showToast(`${booking.responsible} • ${formatDate(booking.date)} • ${booking.time_slot} • ${booking.purpose}${booking.equipment_requests ? ' • ' + booking.equipment_requests : ''}`);
    }

    // Abre o modal de novo agendamento. O acesso à aplicação inteira já
    // é protegido pelo login do administrador (config.php/login.php),
    // então não há mais checagem de perfil aqui — apenas os usuários
    // comuns cadastrados na Área Administrativa têm sua permissão de
    // agendamento controlada (ver cadastrarUsuarioAutorizado/toggleUsuarioAutorizadoAtivo).
    function openBookingModal() {
      document.getElementById('booking-modal').classList.remove('hidden');
      document.getElementById('booking-form').reset();
      document.getElementById('booking-suggestion').classList.add('hidden');
      renderBookingEquipmentChoices();
    }

    // Atalho que abre o modal de agendamento já com data e período
    // preenchidos, a partir de um clique em um horário livre.
    function openBookingModalWithDate(date, slot) {
      openBookingModal();
      document.getElementById('booking-date').value = date;
      document.getElementById('booking-time').value = slot;
    }

    // Fecha o modal de novo agendamento.
    function closeBookingModal() {
      document.getElementById('booking-modal').classList.add('hidden');
    }

    // Desenha, dentro do formulário de agendamento, a lista real de
    // equipamentos cadastrados pela coordenação — com uma miniatura da
    // foto ao lado de cada nome, para quem não conhece o equipamento
    // pelo nome conseguir reconhecê-lo visualmente. Equipamentos fora
    // de "Disponível" aparecem apagados e não podem ser selecionados.
    function renderBookingEquipmentChoices() {
      const container = document.getElementById('booking-equipment-list');
      if (!container) return;

      const equipamentos = allRecords.filter(item => item.record_type === 'equipment');

      if (!equipamentos.length) {
        container.innerHTML = '<p class="col-span-2 text-xs text-gray-500">Nenhum equipamento cadastrado ainda.</p>';
        return;
      }

      container.innerHTML = equipamentos.map(eq => {
        const indisponivel = eq.condition !== 'Disponível';
        return `
          <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 ${indisponivel ? 'opacity-50' : 'hover:border-green-300 cursor-pointer'}">
            <input type="checkbox" value="${eq.name}" class="equipment-choice" ${indisponivel ? 'disabled' : ''}>
            <span class="w-9 h-9 rounded-lg overflow-hidden bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
              ${eq.photo_url
                ? `<img src="${eq.photo_url}" alt="Foto de ${eq.name}" loading="lazy" class="w-full h-full object-cover">`
                : '<span class="text-base">📦</span>'}
            </span>
            <span class="text-gray-800">${eq.name}${indisponivel ? ` (${eq.condition})` : ''}</span>
          </label>
        `;
      }).join('');
    }

    // Processa o envio do formulário de agendamento: valida horários,
    // verifica conflito com reservas aprovadas e, se livre, cria o
    // registro com status "pending" para posterior aprovação.
    async function handleBookingSubmit(event) {
      event.preventDefault();
      
      if (bookings.length >= 999) {
        showToast('Limite de 999 agendamentos atingido.');
        return;
      }
      
      const date = document.getElementById('booking-date').value;
      const timeSlot = document.getElementById('booking-time').value;
      const responsible = document.getElementById('booking-responsible').value;
      const purpose = document.getElementById('booking-purpose').value;
      const description = document.getElementById('booking-description').value;
      const startTime = document.getElementById('booking-start').value;
      const endTime = document.getElementById('booking-end').value;
      const participants = Number(document.getElementById('booking-participants').value);
      const equipmentRequests = [...document.querySelectorAll('.equipment-choice:checked')].map(input => input.value).join(', ');
      const equipmentQuantity = Number(document.getElementById('booking-equipment-quantity').value);
      if (startTime >= endTime) { showToast('O horário de término deve ser posterior ao início.'); return; }

      // Ninguém agenda sem estar cadastrado pela coordenação (aba
      // Administração) e marcado como Ativo — vale tanto para aluno
      // quanto para servidor. O nome digitado aqui precisa bater
      // exatamente com um dos usuários autorizados cadastrados.
      const usuarioAutorizado = allRecords.find(item =>
        item.record_type === 'usuario_autorizado' &&
        item.nome.trim().toLowerCase() === responsible.trim().toLowerCase()
      );
      if (!usuarioAutorizado) {
        showToast('❌ Você ainda não está cadastrado. Fale com a coordenação do CIT para liberar seu agendamento.');
        return;
      }
      if (!usuarioAutorizado.ativo) {
        showToast('❌ Seu cadastro está inativo. Fale com a coordenação do CIT.');
        return;
      }

      const conflict = bookings.find(b => b.date === date && b.time_slot === timeSlot && b.status === 'approved');
      
      if (conflict) {
        const suggestion = findAlternativeSlot(date, timeSlot);
        document.getElementById('suggestion-text').textContent = suggestion;
        document.getElementById('booking-suggestion').classList.remove('hidden');
        return;
      }
      
      const submitBtn = document.getElementById('submit-booking-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';
      
      try {
        const result = await localCreate({
          record_type: 'booking',
          date,
          start_time: startTime,
          end_time: endTime,
          time_slot: timeSlot,
          responsible,
          purpose,
          participants,
          description,
          equipment_requests: equipmentRequests,
          equipment_quantities: String(equipmentQuantity),
          rejection_reason: '',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (result.isOk) {
          closeBookingModal();
          showToast('✅ Agendamento solicitado com sucesso!');
        } else {
          showToast('❌ Erro ao criar agendamento.');
        }
      } catch (error) {
        showToast('❌ Erro ao criar agendamento.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Agendar';
      }
    }

    // Sugere o próximo período livre no mesmo dia ou, se não houver,
    // o mesmo período no dia seguinte.
    function findAlternativeSlot(date, requestedSlot) {
      const requestedIndex = timeSlots.indexOf(requestedSlot);
      const dayBookings = bookings.filter(b => b.date === date && b.status === 'approved');
      const occupiedSlots = dayBookings.map(b => b.time_slot);
      
      for (let i = requestedIndex + 1; i < timeSlots.length; i++) {
        if (!occupiedSlots.includes(timeSlots[i])) {
          return `Horário ${requestedSlot} ocupado. Sugerimos ${timeSlots[i]}.`;
        }
      }
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      return `Horário ${requestedSlot} ocupado. Sugerimos ${requestedSlot} em ${formatDate(nextDayStr)}.`;
    }

    let rejectionBookingId = null;

    // Abre o modal de justificativa de recusa para um agendamento
    // pendente específico.
    function openRejectionModal(backendId) {
      rejectionBookingId = backendId;
      document.getElementById('rejection-reason').value = '';
      document.getElementById('rejection-note').textContent = '';
      document.getElementById('rejection-modal').classList.remove('hidden');
      document.getElementById('rejection-reason').focus();
    }

    // Fecha o modal de justificativa de recusa.
    function closeRejectionModal() {
      rejectionBookingId = null;
      document.getElementById('rejection-modal').classList.add('hidden');
    }

    // Confirma a recusa de um agendamento, exigindo um motivo, e grava o
    // registro com status "rejected" e o texto informado.
    async function confirmRejection() {
      const reason = document.getElementById('rejection-reason').value.trim();
      const button = document.getElementById('confirm-rejection-btn');
      if (!reason) {
        document.getElementById('rejection-note').textContent = 'Informe o motivo antes de confirmar a recusa.';
        return;
      }
      const booking = bookings.find(b => b.__backendId === rejectionBookingId);
      if (!booking) return;
      button.disabled = true;
      button.textContent = 'Salvando...';
      const result = await localUpdate({...booking, status:'rejected', rejection_reason:reason, updated_at:new Date().toISOString()});
      button.disabled = false;
      button.textContent = 'Confirmar recusa';
      if (result.isOk) { closeRejectionModal(); showToast('✅ Recusa registrada com justificativa.'); }
      else document.getElementById('rejection-note').textContent = 'Não foi possível salvar. Tente novamente.';
    }

    // Aprova um agendamento pendente, atualizando seu status para
    // "approved".
    async function approveBooking(backendId) {
      const booking = bookings.find(b => b.__backendId === backendId);
      if (!booking) return;
      
      const result = await localUpdate({
        ...booking,
        status: 'approved'
      });
      
      if (result.isOk) {
        showToast('✅ Agendamento aprovado!');
      } else {
        showToast('❌ Erro ao aprovar.');
      }
    }

    // Remove definitivamente um agendamento da base local.
    async function deleteBooking(backendId) {
      const booking = bookings.find(b => b.__backendId === backendId);
      if (!booking) return;
      
      const result = await localDelete(booking);
      
      if (result.isOk) {
        showToast('✅ Agendamento removido!');
      } else {
        showToast('❌ Erro ao remover.');
      }
    }

    // Processa o formulário de contato, gravando a mensagem como um
    // registro do tipo "contact" e exibindo a confirmação visual.
    async function handleContactSubmit(event) {
      event.preventDefault();
      const button = event.target.querySelector('button[type="submit"]');
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email-input').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      button.disabled = true;
      button.textContent = 'Enviando...';
      const result = await localCreate({record_type:'contact', name, responsible:name, purpose:'Contato', description:message, equipment_requests:email, date:new Date().toISOString().slice(0,10), start_time:'', end_time:'', time_slot:'', participants:0, status:'new', created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
      if (result.isOk) {
        document.getElementById('contact-success').classList.remove('hidden');
        document.getElementById('contact-form').reset();
        setTimeout(() => document.getElementById('contact-success').classList.add('hidden'), 5000);
      } else showToast('Não foi possível enviar a mensagem.');
      button.disabled = false;
      button.textContent = 'Enviar Mensagem';
    }

    // Lista os usuários autorizados a agendar (registros do tipo
    // "usuario_autorizado" — alunos e servidores) no card "Cadastrar
    // usuário autorizado" da Área Administrativa, cada um com seu papel,
    // um botão para alternar Ativo/Inativo e um botão para remover.
    function renderUsuariosAutorizadosList() {
      const container = document.getElementById('lista-usuarios-autorizados');
      // Sem login, a Área Administrativa nem é renderizada no HTML
      // (ver includes/main-content.php) — não há o que atualizar aqui.
      if (!container) return;

      const usuarios = allRecords.filter(item => item.record_type === 'usuario_autorizado');

      if (!usuarios.length) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">Ninguém cadastrado ainda — nenhum agendamento será aceito até o primeiro cadastro.</p>';
        return;
      }

      container.innerHTML = usuarios.map(u => `
        <div class="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-green-200">
          <span class="text-sm font-semibold text-gray-800">${u.nome} <span class="text-xs font-normal text-gray-500">(${u.papel === 'servidor' ? 'Servidor' : 'Aluno'})</span></span>
          <div class="flex items-center gap-2">
            <button onclick="toggleUsuarioAutorizadoAtivo('${u.__backendId}')" class="px-3 py-1 rounded-full text-xs font-bold ${u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${u.ativo ? 'Ativo' : 'Inativo'}</button>
            <button onclick="removerUsuarioAutorizado('${u.__backendId}')" class="text-gray-400 hover:text-red-600 font-bold text-sm" title="Remover cadastro" aria-label="Remover ${u.nome}">✕</button>
          </div>
        </div>
      `).join('');
    }

    // Cadastra um novo usuário autorizado (aluno ou servidor) a partir
    // do nome e papel informados. A partir daqui, esse nome passa a
    // conseguir agendar a sala pelo Calendário — desde que fique Ativo.
    async function cadastrarUsuarioAutorizado() {
      const input = document.getElementById('novo-usuario-nome');
      const selectPapel = document.getElementById('novo-usuario-papel');
      const nota = document.getElementById('usuario-cadastro-note');
      const nome = input.value.trim();
      const papel = selectPapel.value;

      if (!nome) { showToast('Informe o nome do aluno ou servidor.'); return; }

      const jaExiste = allRecords.some(item => item.record_type === 'usuario_autorizado' && item.nome.toLowerCase() === nome.toLowerCase());
      if (jaExiste) {
        if (nota) nota.textContent = 'Esse nome já está cadastrado.';
        return;
      }

      const payload = { record_type:'usuario_autorizado', nome, papel, ativo:true, created_at:new Date().toISOString(), updated_at:new Date().toISOString(), name:'', equipment_type:'', category:'', photo_url:'', quantity:0, condition:'', status:'active', date:'', start_time:'', end_time:'', time_slot:'', responsible:'', purpose:'', participants:0, description:'', equipment_requests:'' };
      const result = await localCreate(payload);

      if (result.isOk) {
        showToast(`✅ ${nome} cadastrado(a) como ${papel === 'servidor' ? 'servidor' : 'aluno'}.`);
        input.value = '';
        if (nota) nota.textContent = 'Só quem estiver cadastrado aqui e marcado como Ativo consegue agendar a sala pelo Calendário.';
        renderUsuariosAutorizadosList();
      } else {
        showToast('❌ Não foi possível cadastrar.');
      }
    }

    // Alterna a situação (Ativo/Inativo) de um usuário já cadastrado.
    // Enquanto Inativo, essa pessoa não consegue concluir agendamentos.
    async function toggleUsuarioAutorizadoAtivo(backendId) {
      const usuario = allRecords.find(item => item.__backendId === backendId && item.record_type === 'usuario_autorizado');
      if (!usuario) return;
      const novoStatus = !usuario.ativo;
      const result = await localUpdate({ ...usuario, ativo: novoStatus, updated_at: new Date().toISOString() });
      if (result.isOk) {
        showToast(`✅ ${usuario.nome} agora está ${novoStatus ? 'ativo' : 'inativo'}.`);
        renderUsuariosAutorizadosList();
      } else {
        showToast('❌ Não foi possível atualizar a situação.');
      }
    }

    // Remove definitivamente o cadastro de um usuário autorizado.
    async function removerUsuarioAutorizado(backendId) {
      const usuario = allRecords.find(item => item.__backendId === backendId && item.record_type === 'usuario_autorizado');
      if (!usuario) return;
      const result = await localDelete(usuario);
      if (result.isOk) {
        showToast(`✅ Cadastro de ${usuario.nome} removido.`);
        renderUsuariosAutorizadosList();
      } else {
        showToast('❌ Não foi possível remover o cadastro.');
      }
    }

    // Lista o histórico de agendamentos aprovados, aplicando os filtros
    // de mês/data selecionados no painel de Histórico.
    function renderHistoryResults() {
      const target = document.getElementById('history-results');
      if (!target) return;
      const month = document.getElementById('history-month')?.value || '';
      const date = document.getElementById('history-date')?.value || '';
      const records = bookings.filter(b => b.status === 'approved' && (!month || b.date.startsWith(month)) && (!date || b.date === date)).sort((a,b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`));
      target.innerHTML = records.length ? records.map(b => `<div class="bg-white p-4 rounded-xl border border-blue-200 mb-3"><div class="font-bold text-gray-800">${formatDate(b.date)} • ${b.start_time}–${b.end_time}</div><div class="text-sm text-gray-600 mt-1"><strong>${b.responsible}</strong> utilizou a sala para ${b.purpose}, com ${b.participants || 0} participantes.</div><div class="text-xs text-gray-500 mt-1">Equipamentos: ${b.equipment_requests || 'Nenhum'}</div></div>`).join('') : '<p class="text-gray-500 text-center py-6">Nenhum registro encontrado para o período selecionado.</p>';
    }

    function filterHistory() { renderHistoryResults(); }
    function clearHistoryFilters() { document.getElementById('history-month').value = ''; document.getElementById('history-date').value = ''; renderHistoryResults(); }

    // Alterna entre as abas do painel administrativo (Agenda, Histórico,
    // Equipamentos), destacando a aba ativa.
    function showAdminPanel(panel) {
      const painel = document.getElementById(`admin-panel-${panel}`);
      const aba = document.getElementById(`admin-tab-${panel}`);
      if (!painel || !aba) return; // Botões só existem para quem está logado.
      document.querySelectorAll('.admin-panel').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.admin-tab').forEach(el => {
        el.className = 'admin-tab px-4 py-2 rounded-lg bg-white border-2 border-green-200 text-gray-700 font-bold text-sm';
      });
      painel.classList.remove('hidden');
      aba.className = 'admin-tab px-4 py-2 rounded-lg bg-green-600 text-white font-bold text-sm';
      renderAdminPanels();
    }

    // Redesenha o conteúdo das três abas administrativas: agenda completa,
    // filtros de histórico e cadastro/lista de equipamentos.
    function renderAdminPanels() {
      const agenda = document.getElementById('admin-panel-agenda');
      const historico = document.getElementById('admin-panel-historico');
      const equipamentos = document.getElementById('admin-panel-equipamentos');
      // Sem login, esses elementos não existem no HTML (ver
      // includes/main-content.php) — nada a redesenhar aqui.
      if (!agenda || !historico || !equipamentos) return;
      const sorted = [...bookings].sort((a,b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      agenda.innerHTML = sorted.length ? sorted.map(b => `<div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-green-200 mb-3"><div><strong>${b.responsible}</strong><div class="text-sm text-gray-600">${formatDate(b.date)} • ${b.start_time}–${b.end_time} • ${b.purpose}</div><div class="text-xs text-gray-500">${b.participants || 0} participantes${b.equipment_requests ? ' • ' + b.equipment_requests : ''}</div></div><span class="px-3 py-1 rounded-full text-xs font-bold ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${b.status === 'approved' ? 'Aprovado' : 'Pendente'}</span></div>`).join('') : '<p class="text-gray-500 text-center py-6">Nenhum agendamento cadastrado.</p>';
      historico.innerHTML = `<div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-5"><div class="grid sm:grid-cols-2 gap-3"><div><label for="history-month" class="block text-xs font-bold text-gray-700 mb-1">Filtrar por mês</label><input id="history-month" type="month" onchange="filterHistory()" class="w-full px-3 py-2 rounded-lg border-2 border-blue-200"></div><div><label for="history-date" class="block text-xs font-bold text-gray-700 mb-1">Filtrar por data</label><input id="history-date" type="date" onchange="filterHistory()" class="w-full px-3 py-2 rounded-lg border-2 border-blue-200"></div></div><button onclick="clearHistoryFilters()" class="mt-3 text-sm font-bold text-blue-700 underline">Limpar filtros</button></div><div id="history-results"></div>`;
      renderHistoryResults();
      equipamentos.innerHTML = `<div class="grid sm:grid-cols-2 gap-3 mb-2"><input id="new-equipment-name" aria-label="Nome do equipamento" placeholder="Nome do equipamento" class="px-4 py-3 rounded-lg border-2 border-green-200"><select id="new-equipment-type" aria-label="Tipo do equipamento" class="px-4 py-3 rounded-lg border-2 border-green-200"><option value="Informática">Informática</option><option value="Audiovisual">Audiovisual</option><option value="Mobiliário">Mobiliário</option><option value="Outro">Outro</option></select><input id="new-equipment-category" aria-label="Classificação do equipamento" placeholder="Classificação (ex.: Projeção)" class="px-4 py-3 rounded-lg border-2 border-green-200"><div><label for="new-equipment-photo" class="sr-only">Foto do equipamento</label><input id="new-equipment-photo" aria-label="Foto do equipamento" type="file" accept="image/*" class="w-full px-3 py-2.5 rounded-lg border-2 border-green-200 bg-white text-sm"></div><input id="new-equipment-quantity" aria-label="Quantidade" type="number" min="1" value="1" class="px-4 py-3 rounded-lg border-2 border-green-200"><select id="new-equipment-condition" aria-label="Situação" class="px-4 py-3 rounded-lg border-2 border-green-200"><option>Disponível</option><option>Indisponível</option><option>Em manutenção</option></select><button onclick="addEquipment()" class="px-5 py-3 rounded-lg bg-green-600 text-white font-bold">Cadastrar equipamento</button></div><p class="text-xs text-gray-500 mb-5">Escolha uma foto do seu computador ou celular (opcional, ideal até 1MB) — ela ajuda quem for agendar a reconhecer o equipamento.</p><div id="equipment-list"></div>`;
      renderEquipmentList();
    }

    // Lista os equipamentos cadastrados (registros do tipo "equipment"),
    // com foto, tipo, categoria, quantidade e situação.
    function renderEquipmentList() {
      const list = document.getElementById('equipment-list');
      if (!list) return;
      const items = allRecords.filter(b => b.record_type === 'equipment');
      list.innerHTML = items.length ? items.map(e => `<div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-green-200 mb-3"><div class="flex items-center gap-4"><div class="w-16 h-16 rounded-xl overflow-hidden bg-green-50 border border-green-200 flex items-center justify-center">${e.photo_url ? `<img src="${e.photo_url}" alt="Foto de ${e.name}" loading="lazy" class="w-full h-full object-cover" onerror="this.style.display='none';this.parentElement.textContent='📦'">` : '<span class="text-2xl">📦</span>'}</div><div><strong>${e.name}</strong><div class="text-sm text-gray-600">${e.equipment_type || 'Não classificado'} • ${e.category || 'Sem classificação'}</div><div class="text-sm text-gray-600">Quantidade: ${e.quantity}</div></div></div><div class="flex items-center gap-2"><span class="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800">${e.condition}</span><button onclick="showEquipmentDetails('${e.__backendId}')" class="px-3 py-2 rounded-lg border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs">Ver detalhes</button><button onclick="deleteEquipment('${e.__backendId}')" class="px-3 py-2 rounded-lg border-2 border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs">Remover</button></div></div>`).join('') : '<p class="text-gray-500 text-center py-6">Nenhum equipamento cadastrado. Cadastre o primeiro acima.</p>';
    }

    // Mostra os detalhes de um equipamento em um toast.
    function showEquipmentDetails(backendId) {
      const equipment = allRecords.find(item => item.__backendId === backendId && item.record_type === 'equipment');
      if (!equipment) return;
      showToast(`${equipment.name} • Tipo: ${equipment.equipment_type || 'Não informado'} • Classificação: ${equipment.category || 'Não informada'} • Quantidade: ${equipment.quantity} • Situação: ${equipment.condition}`);
    }

    // Remove um equipamento cadastrado.
    async function deleteEquipment(backendId) {
      const equipment = allRecords.find(item => item.__backendId === backendId && item.record_type === 'equipment');
      if (!equipment) return;
      const result = await localDelete(equipment);
      if (result.isOk) {
        showToast('✅ Equipamento removido!');
      } else {
        showToast('❌ Não foi possível remover o equipamento.');
      }
    }

    // Lê um arquivo escolhido pelo usuário (input type="file") e devolve
    // seu conteúdo como uma data URL em base64, pronta para ser salva no
    // localStorage e usada diretamente em uma tag <img>.
    function lerArquivoComoDataURL(arquivo) {
      return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(arquivo);
      });
    }

    // Cadastra um novo equipamento a partir dos campos do formulário da
    // aba Equipamentos, validando nome e quantidade mínima. A foto é
    // opcional: se o usuário escolher um arquivo, ele é convertido para
    // base64 e salvo junto do registro (sem depender de link externo).
    async function addEquipment() {
      const name = document.getElementById('new-equipment-name').value.trim();
      const equipmentType = document.getElementById('new-equipment-type').value;
      const category = document.getElementById('new-equipment-category').value.trim();
      const quantity = Number(document.getElementById('new-equipment-quantity').value);
      const condition = document.getElementById('new-equipment-condition').value;
      const inputFoto = document.getElementById('new-equipment-photo');
      const arquivoFoto = inputFoto.files && inputFoto.files[0];

      if (!name || quantity < 1) { showToast('Informe o nome e uma quantidade válida.'); return; }

      let photoUrl = '';
      if (arquivoFoto) {
        try {
          photoUrl = await lerArquivoComoDataURL(arquivoFoto);
        } catch (erro) {
          showToast('❌ Não foi possível ler a foto selecionada. O equipamento não foi cadastrado.');
          return;
        }
      }

      const result = await localCreate({record_type:'equipment', name, equipment_type:equipmentType, category, photo_url:photoUrl, quantity, condition, status:'active', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), date:'', start_time:'', end_time:'', time_slot:'', responsible:'', purpose:'', participants:0, description:'', equipment_requests:''});
      if (result.isOk) { showToast('✅ Equipamento cadastrado!'); renderAdminPanels(); } else showToast('❌ Não foi possível cadastrar.');
    }

    // Gera um arquivo .json com todos os agendamentos e dispara o download
    // no navegador (Blob + link temporário).
    function exportData() {
      const dataStr = JSON.stringify(bookings, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agendamentos-cit-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Dados exportados!');
    }

    // Formata uma data no padrão ISO (AAAA-MM-DD) para o formato
    // brasileiro (DD/MM/AAAA).
    function formatDate(dateStr) {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Converte um timestamp ISO em um texto de tempo relativo
    // ("agora", "5min", "3h", "2d").
    function getRelativeTime(isoString) {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'agora';
      if (diffMins < 60) return `${diffMins}min`;
      if (diffHours < 24) return `${diffHours}h`;
      return `${diffDays}d`;
    }

    // Exibe uma notificação temporária (toast) no canto da tela.
    function showToast(message) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-message').textContent = message;
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3000);
    }

    // Alterna a visibilidade do menu de navegação mobile.
    function toggleMobileMenu() {
      document.getElementById('mobile-menu').classList.toggle('hidden');
    }

    // Rola suavemente a página até a seção informada.
    function scrollToSection(sectionId) {
      document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    }

    // Ponto de entrada: carrega os registros do localStorage, aplica a
    // configuração institucional e desenha toda a interface. A seção
    // Administração só existe no HTML para quem está logado (ver
    // includes/main-content.php); as funções abaixo já verificam isso
    // antes de tentar renderizar qualquer coisa nela.
    async function init() {
      refreshRecords();
      applyConfig(resolvedConfig);
      updateUI();
      renderAdminPanels();
      renderUsuariosAutorizadosList();
      renderCalendar();
    }

    init();